/**
 * gRPC-Web client for the RustBill customer frontend.
 *
 * Uses the hand-rolled proto-codec for binary protobuf encoding/decoding.
 * Manages JWT tokens in localStorage and handles token refresh.
 */

import { encodeMessage, decodeMessage } from './proto-codec';
import type { MessageDef } from './proto-codec';
import {
  RegisterRequestDef,
  RegisterResponseDef,
  SendVerificationCodeRequestDef,
  SendVerificationCodeResponseDef,
  LoginRequestDef,
  LoginResponseDef,
  RefreshTokenRequestDef,
  RefreshTokenResponseDef,
  GetMeRequestDef,
  GetMeResponseDef,
  LogoutRequestDef,
  LogoutResponseDef,
  ChangePasswordRequestDef,
  ChangePasswordResponseDef,
  ListProductsRequestDef,
  ListProductsResponseDef,
  GetProductRequestDef,
  GetProductResponseDef,
  ListProductGroupsRequestDef,
  ListProductGroupsResponseDef,
  CreateProductCategoryRequestDef,
  ListProductCategoriesRequestDef,
  ListProductCategoriesResponseDef,
  GetProductCategoryRequestDef,
  GetProductCategoryResponseDef,
  UpdateProductCategoryRequestDef,
  DeleteProductCategoryRequestDef,
  ListGatewaysResponseDef,
  CreateOrderRequestDef,
  CreateOrderResponseDef,
  ListOrdersRequestDef,
  ListOrdersResponseDef,
  GetOrderRequestDef,
  GetOrderResponseDef,
  PayOrderRequestDef,
  PayOrderResponseDef,
  ListInvoicesRequestDef,
  ListInvoicesResponseDef,
  GetInvoiceRequestDef,
  GetInvoiceResponseDef,
  ListPaymentsRequestDef,
  ListPaymentsResponseDef,
  GetPaymentRequestDef,
  GetPaymentResponseDef,
  ListInstancesRequestDef,
  ListInstancesResponseDef,
  GetInstanceRequestDef,
  GetInstanceResponseDef,
  GetBalanceRequestDef,
  GetBalanceResponseDef,
  ListBalanceTransactionsRequestDef,
  ListBalanceTransactionsResponseDef,
  ListTicketsRequestDef,
  ListTicketsResponseDef,
  GetTicketRequestDef,
  GetTicketResponseDef,
  CreateTicketRequestDef,
  CreateTicketResponseDef,
  CreateReplyRequestDef,
  CreateReplyResponseDef,
  ListProvidersResponseDef,
  CreateApiKeyRequestDef,
  CreateApiKeyResponseDef,
  ListApiKeysRequestDef,
  ListApiKeysResponseDef,
  RevokeApiKeyRequestDef,
  RevokeApiKeyResponseDef,
} from './proto-defs';

// ── Config ──────────────────────────────────────────────────────

let grpcEndpoint = '';

async function selectFastestEndpoint(endpoints: string[]): Promise<string> {
  // Single endpoint: use directly, no need to ping
  if (endpoints.length <= 1) {
    return endpoints[0] || '';
  }

  const ping = (url: string): Promise<{ url: string; latency: number }> =>
    new Promise((resolve, reject) => {
      const start = performance.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
        reject(new Error('timeout'));
      }, 3000);

      fetch(`${url}/health`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
        // opaque for cross-origin (we only care about latency, not response body)
        mode: 'cors',
      })
        .then(() => {
          clearTimeout(timeout);
          resolve({ url, latency: performance.now() - start });
        })
        .catch(() => {
          clearTimeout(timeout);
          reject(new Error('unreachable'));
        });
    });

  const results = await Promise.allSettled(endpoints.map(ping));

  let best: { url: string; latency: number } | null = null;
  for (const r of results) {
    if (r.status === 'fulfilled' && (best === null || r.value.latency < best.latency)) {
      best = r.value;
    }
  }

  // Fallback to first endpoint if all unreachable
  return best ? best.url : endpoints[0];
}

export async function loadConfig(): Promise<void> {
  try {
    const resp = await fetch('/config.json', { cache: 'no-cache' });
    if (resp.ok) {
      const cfg = await resp.json();
      // Support both new `endpoints` array and legacy `grpcEndpoint` string
      const endpoints: string[] | undefined = cfg.endpoints;
      if (endpoints && endpoints.length > 0) {
        grpcEndpoint = await selectFastestEndpoint(endpoints);
      } else if (cfg.grpcEndpoint) {
        grpcEndpoint = cfg.grpcEndpoint as string;
      }
    }
  } catch {
    // Use default empty endpoint
  }

  // Preconnect to gRPC backend (cross-origin only)
  if (grpcEndpoint && !grpcEndpoint.startsWith('/')) {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = grpcEndpoint;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
}

function baseUrl(): string {
  return grpcEndpoint || '';
}

// ── Token management ────────────────────────────────────────────

const TOKEN_KEY = 'rustbill_customer_token';
const REFRESH_KEY = 'rustbill_customer_refresh';
const EXPIRES_KEY = 'rustbill_customer_expires';
const CUSTOMER_ID_KEY = 'rustbill_customer_id';

export function setTokens(
  accessToken: string,
  refreshToken?: string,
  expiresIn?: number,
): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }
  if (expiresIn) {
    const expiresAt = Date.now() + expiresIn * 1000;
    localStorage.setItem(EXPIRES_KEY, String(expiresAt));
  }
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  localStorage.removeItem(CUSTOMER_ID_KEY);
}

export function loadTokens(): void {
  // Tokens are read on-demand via getToken()
}

export function setCustomerId(id: string): void {
  localStorage.setItem(CUSTOMER_ID_KEY, id);
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export async function tryRefreshToken(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;

  try {
    const reqBytes = encodeMessage(RefreshTokenRequestDef, { refreshToken: rt });

    // gRPC-Web frame: 0x00 marker + 4-byte BE length + payload
    const frame = new Uint8Array(5 + reqBytes.length);
    frame[0] = 0x00;
    new DataView(frame.buffer).setUint32(1, reqBytes.length, false);
    frame.set(reqBytes, 5);

    const resp = await fetch(`${baseUrl()}/rustbill.identity.IdentityService/RefreshToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/grpc-web+proto',
        'X-Grpc-Web': '1',
      },
      body: frame,
    });

    if (!resp.ok) return false;

    const grpcStatus = resp.headers.get('grpc-status');
    if (grpcStatus && grpcStatus !== '0') return false;

    const buf = await resp.arrayBuffer();
    const body = new Uint8Array(buf);
    if (body.length < 5) return false;

    const grpcLen = new DataView(body.buffer, body.byteOffset, 5).getUint32(1, false);
    const msgBytes = body.slice(5, 5 + grpcLen);

    const data = decodeMessage(RefreshTokenResponseDef, msgBytes);
    const accessToken = data.accessToken as string;
    const expiresIn = data.expiresIn ? Number(data.expiresIn) : undefined;

    if (accessToken) {
      setTokens(accessToken, rt, expiresIn);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ── gRPC call helper ────────────────────────────────────────────

async function grpcCall(
  service: string,
  method: string,
  reqDef: MessageDef,
  resDef: MessageDef,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const reqBytes = encodeMessage(reqDef, payload);

  // gRPC-Web frame: 0x00 marker + 4-byte BE length + protobuf payload
  const frame = new Uint8Array(5 + reqBytes.length);
  frame[0] = 0x00;
  new DataView(frame.buffer).setUint32(1, reqBytes.length, false);
  frame.set(reqBytes, 5);

  const headers: Record<string, string> = {
    'Content-Type': 'application/grpc-web+proto',
    'X-Grpc-Web': '1',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const resp = await fetch(`${baseUrl()}/${service}/${method}`, {
    method: 'POST',
    headers,
    body: frame,
  });

  const grpcStatus = resp.headers.get('grpc-status');
  if (grpcStatus && grpcStatus !== '0') {
    const grpcMessage = resp.headers.get('grpc-message') || 'gRPC error';
    const err = new Error(grpcMessage);
    (err as unknown as Record<string, unknown>).grpcStatus = grpcStatus;
    throw err;
  }

  const buf = await resp.arrayBuffer();
  const body = new Uint8Array(buf);

  if (body.length < 5) {
    return {};
  }

  const grpcLen = new DataView(body.buffer, body.byteOffset, 5).getUint32(1, false);
  const msgBytes = body.slice(5, 5 + grpcLen);

  if (msgBytes.length === 0) {
    return {};
  }

  return decodeMessage(resDef, msgBytes);
}

// ── Public API ──────────────────────────────────────────────────

export const api = {
  // Identity
  register(payload: Record<string, unknown>) {
    return grpcCall(
      'rustbill.identity.IdentityService',
      'Register',
      RegisterRequestDef,
      RegisterResponseDef,
      payload,
    );
  },

  sendVerificationCode(payload: Record<string, unknown>) {
    return grpcCall(
      'rustbill.identity.IdentityService',
      'SendVerificationCode',
      SendVerificationCodeRequestDef,
      SendVerificationCodeResponseDef,
      payload,
    );
  },

  login(payload: Record<string, unknown>) {
    return grpcCall(
      'rustbill.identity.IdentityService',
      'Login',
      LoginRequestDef,
      LoginResponseDef,
      payload,
    );
  },

  logout() {
    return grpcCall(
      'rustbill.identity.IdentityService',
      'Logout',
      LogoutRequestDef,
      LogoutResponseDef,
      {},
    );
  },

  getMe() {
    return grpcCall(
      'rustbill.identity.IdentityService',
      'GetMe',
      GetMeRequestDef,
      GetMeResponseDef,
      {},
    );
  },

  refreshToken(token: string) {
    return grpcCall(
      'rustbill.identity.IdentityService',
      'RefreshToken',
      RefreshTokenRequestDef,
      RefreshTokenResponseDef,
      { refreshToken: token },
    );
  },

  changePassword(payload: Record<string, unknown>) {
    return grpcCall(
      'rustbill.identity.IdentityService',
      'ChangePassword',
      ChangePasswordRequestDef,
      ChangePasswordResponseDef,
      payload,
    );
  },

  // Products
  listProducts(payload: Record<string, unknown> = {}) {
    return grpcCall(
      'rustbill.product.ProductService',
      'ListProducts',
      ListProductsRequestDef,
      ListProductsResponseDef,
      payload,
    );
  },

  getProduct(id: string) {
    return grpcCall(
      'rustbill.product.ProductService',
      'GetProduct',
      GetProductRequestDef,
      GetProductResponseDef,
      { id },
    );
  },

  listProductGroups(payload: Record<string, unknown> = {}) {
    return grpcCall(
      'rustbill.product.ProductGroupService',
      'ListProductGroups',
      ListProductGroupsRequestDef,
      ListProductGroupsResponseDef,
      payload,
    );
  },

  // Product Categories
  listProductCategories(page = 1, pageSize = 50) {
    return grpcCall(
      'rustbill.product.ProductCategoryService',
      'ListProductCategories',
      ListProductCategoriesRequestDef,
      ListProductCategoriesResponseDef,
      { pagination: { page, pageSize } },
    );
  },

  getProductCategory(id: string) {
    return grpcCall(
      'rustbill.product.ProductCategoryService',
      'GetProductCategory',
      GetProductCategoryRequestDef,
      GetProductCategoryResponseDef,
      { id },
    );
  },

  createProductCategory(name: string, description: string, sortOrder: number) {
    return grpcCall(
      'rustbill.product.ProductCategoryService',
      'CreateProductCategory',
      CreateProductCategoryRequestDef,
      GetProductCategoryResponseDef,
      { name, description, sortOrder },
    );
  },

  updateProductCategory(id: string, updates: Record<string, unknown>) {
    return grpcCall(
      'rustbill.product.ProductCategoryService',
      'UpdateProductCategory',
      UpdateProductCategoryRequestDef,
      GetProductCategoryResponseDef,
      { id, ...updates },
    );
  },

  deleteProductCategory(id: string) {
    return grpcCall(
      'rustbill.product.ProductCategoryService',
      'DeleteProductCategory',
      DeleteProductCategoryRequestDef,
      { fields: [] },
      { id },
    );
  },

  listProductGroupsByCategory(categoryId: string) {
    return grpcCall(
      'rustbill.product.ProductGroupService',
      'ListProductGroups',
      ListProductGroupsRequestDef,
      ListProductGroupsResponseDef,
      { categoryId },
    );
  },

  // Integration
  listProviders() {
    return grpcCall(
      'rustbill.integration.IntegrationService',
      'ListProviders',
      { fields: [] },
      ListProvidersResponseDef,
      {},
    );
  },

  listGateways() {
    return grpcCall(
      'rustbill.integration.IntegrationService',
      'ListGateways',
      { fields: [] },
      ListGatewaysResponseDef,
      {},
    );
  },

  // Orders
  createOrder(payload: Record<string, unknown>) {
    return grpcCall(
      'rustbill.order.OrderService',
      'CreateOrder',
      CreateOrderRequestDef,
      CreateOrderResponseDef,
      payload,
    );
  },

  listOrders(payload: Record<string, unknown> = {}) {
    return grpcCall(
      'rustbill.order.OrderService',
      'ListOrders',
      ListOrdersRequestDef,
      ListOrdersResponseDef,
      payload,
    );
  },

  getOrder(id: string) {
    return grpcCall(
      'rustbill.order.OrderService',
      'GetOrder',
      GetOrderRequestDef,
      GetOrderResponseDef,
      { id },
    );
  },

  payOrder(orderId: string, gatewayId: string) {
    return grpcCall(
      'rustbill.order.OrderService',
      'PayOrder',
      PayOrderRequestDef,
      PayOrderResponseDef,
      { orderId, gatewayId },
    );
  },

  // Invoices
  listInvoices(payload: Record<string, unknown> = {}) {
    return grpcCall(
      'rustbill.billing.BillingService',
      'ListInvoices',
      ListInvoicesRequestDef,
      ListInvoicesResponseDef,
      payload,
    );
  },

  getInvoice(id: string) {
    return grpcCall(
      'rustbill.billing.BillingService',
      'GetInvoice',
      GetInvoiceRequestDef,
      GetInvoiceResponseDef,
      { id },
    );
  },

  // Payments
  listPayments(payload: Record<string, unknown> = {}) {
    return grpcCall(
      'rustbill.payment.PaymentService',
      'ListPayments',
      ListPaymentsRequestDef,
      ListPaymentsResponseDef,
      payload,
    );
  },

  getPayment(id: string) {
    return grpcCall(
      'rustbill.payment.PaymentService',
      'GetPayment',
      GetPaymentRequestDef,
      GetPaymentResponseDef,
      { id },
    );
  },

  // Instances
  listInstances(payload: Record<string, unknown> = {}) {
    return grpcCall(
      'rustbill.instance.InstanceService',
      'ListInstances',
      ListInstancesRequestDef,
      ListInstancesResponseDef,
      payload,
    );
  },

  getInstance(id: string) {
    return grpcCall(
      'rustbill.instance.InstanceService',
      'GetInstance',
      GetInstanceRequestDef,
      GetInstanceResponseDef,
      { id },
    );
  },

  // Balance
  getBalance(payload: Record<string, unknown> = {}) {
    return grpcCall(
      'rustbill.balance.BalanceService',
      'GetBalance',
      GetBalanceRequestDef,
      GetBalanceResponseDef,
      payload,
    );
  },

  listBalanceTransactions(payload: Record<string, unknown> = {}) {
    return grpcCall(
      'rustbill.balance.BalanceService',
      'ListBalanceTransactions',
      ListBalanceTransactionsRequestDef,
      ListBalanceTransactionsResponseDef,
      payload,
    );
  },

  // Tickets
  createTicket(payload: Record<string, unknown>) {
    return grpcCall(
      'rustbill.ticket.TicketService',
      'CreateTicket',
      CreateTicketRequestDef,
      CreateTicketResponseDef,
      payload,
    );
  },

  listTickets(payload: Record<string, unknown> = {}) {
    return grpcCall(
      'rustbill.ticket.TicketService',
      'ListTickets',
      ListTicketsRequestDef,
      ListTicketsResponseDef,
      payload,
    );
  },

  getTicket(id: string) {
    return grpcCall(
      'rustbill.ticket.TicketService',
      'GetTicket',
      GetTicketRequestDef,
      GetTicketResponseDef,
      { id },
    );
  },

  createTicketReply(payload: Record<string, unknown>) {
    return grpcCall(
      'rustbill.ticket.TicketService',
      'CreateReply',
      CreateReplyRequestDef,
      CreateReplyResponseDef,
      payload,
    );
  },
};

// ── Public types (used by dashboard pages) ──────────────────────

export interface PageMeta {
  total: string | number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface InvoiceItemInfo {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  amount: string;
}

export interface InvoiceInfo {
  id: string;
  invoiceNumber: string;
  customerId: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  amount: string;
  taxAmount: string;
  totalAmount: string;
  status: string;
  issuedAt: string;
  paidAt: string;
  dueDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItemInfo[];
}

export interface TicketReplyInfo {
  id: string;
  ticketId: string;
  userId: string;
  customerId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface TicketInfo {
  id: string;
  customerId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeUserId: string;
  creatorUserId: string;
  createdAt: string;
  updatedAt: string;
  replies: TicketReplyInfo[];
}

export interface BalanceTransactionInfo {
  id: string;
  customerId: string;
  amount: string;
  balanceAfter: string;
  transactionType: string;
  referenceId: string;
  description: string;
  createdAt: string;
}

export interface ProductCategoryInfo {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  groupCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── ApiKeyService (downstream.proto) ───────────────────────────────

export interface ApiKeyInfo {
  id: string;
  keyPrefix: string;
  name: string;
  enabled: boolean;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

export async function createApiKey(name: string): Promise<{ apiKey: string; keyPrefix: string; id: string }> {
  const response = await grpcCall(
    'rustbill.downstream.ApiKeyService',
    'CreateApiKey',
    CreateApiKeyRequestDef,
    CreateApiKeyResponseDef,
    { name },
  );
  return { apiKey: (response.apiKey as string) || '', keyPrefix: (response.keyPrefix as string) || '', id: (response.id as string) || '' };
}

export async function listApiKeys(): Promise<ApiKeyInfo[]> {
  const response = await grpcCall(
    'rustbill.downstream.ApiKeyService',
    'ListApiKeys',
    ListApiKeysRequestDef,
    ListApiKeysResponseDef,
    {},
  );
  return ((response.keys || []) as any[]).map((k: any) => ({
    id: (k.id as string) || '',
    keyPrefix: (k.keyPrefix as string) || '',
    name: (k.name as string) || '',
    enabled: Boolean(k.enabled),
    createdAt: (k.createdAt as string) || '',
    lastUsedAt: (k.lastUsedAt as string) || '',
    expiresAt: (k.expiresAt as string) || '',
  }));
}

export async function revokeApiKey(id: string): Promise<void> {
  await grpcCall(
    'rustbill.downstream.ApiKeyService',
    'RevokeApiKey',
    RevokeApiKeyRequestDef,
    RevokeApiKeyResponseDef,
    { id },
  );
}
