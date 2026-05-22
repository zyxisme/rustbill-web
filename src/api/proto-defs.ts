/**
 * Proto message schema definitions for the customer frontend.
 *
 * Field numbers and types must exactly match the RustBill .proto definitions.
 * Field names use camelCase (matching the web-admin's naming convention
 * for consistency across both frontends).
 */
import type { MessageDef } from './proto-codec';

// ── common.proto ──────────────────────────────────────────────

export const PageRequestDef: MessageDef = {
  fields: [
    { no: 1, name: 'page', type: 'uint32' },
    { no: 2, name: 'pageSize', type: 'uint32' },
  ],
};

export const PageMetaDef: MessageDef = {
  fields: [
    { no: 1, name: 'total', type: 'uint64' },
    { no: 2, name: 'page', type: 'uint32' },
    { no: 3, name: 'pageSize', type: 'uint32' },
    { no: 4, name: 'totalPages', type: 'uint32' },
  ],
};

// ── identity.proto ────────────────────────────────────────────

export const UserInfoDef: MessageDef = {
  fields: [
    { no: 1, name: 'id', type: 'string' },
    { no: 2, name: 'username', type: 'string' },
    { no: 3, name: 'email', type: 'string' },
    { no: 4, name: 'displayName', type: 'string' },
    { no: 5, name: 'role', type: 'string' },
    { no: 6, name: 'isActive', type: 'bool' },
    { no: 7, name: 'createdAt', type: 'string' },
    { no: 8, name: 'userType', type: 'string' },
    { no: 9, name: 'customerId', type: 'string' },
  ],
};

export const RegisterRequestDef: MessageDef = {
  fields: [
    { no: 1, name: 'username', type: 'string' },
    { no: 2, name: 'email', type: 'string' },
    { no: 3, name: 'displayName', type: 'string' },
    { no: 4, name: 'password', type: 'string' },
    { no: 5, name: 'verificationCode', type: 'string' },
  ],
};

export const SendVerificationCodeRequestDef: MessageDef = {
  fields: [
    { no: 1, name: 'email', type: 'string' },
    { no: 2, name: 'purpose', type: 'string' },
  ],
};

export const SendVerificationCodeResponseDef: MessageDef = {
  fields: [
    { no: 1, name: 'sent', type: 'bool' },
    { no: 2, name: 'message', type: 'string' },
    { no: 3, name: 'retryAfterSecs', type: 'int32' },
  ],
};

export const RegisterResponseDef: MessageDef = {
  fields: [
    { no: 1, name: 'user', type: 'message', message: UserInfoDef },
    { no: 2, name: 'customerId', type: 'string' },
  ],
};

export const LoginRequestDef: MessageDef = {
  fields: [
    { no: 1, name: 'username', type: 'string' },
    { no: 2, name: 'password', type: 'string' },
    { no: 3, name: 'userType', type: 'string' },
  ],
};

export const LoginResponseDef: MessageDef = {
  fields: [
    { no: 1, name: 'accessToken', type: 'string' },
    { no: 2, name: 'refreshToken', type: 'string' },
    { no: 3, name: 'expiresIn', type: 'int64' },
    { no: 4, name: 'user', type: 'message', message: UserInfoDef },
    { no: 5, name: 'adminPath', type: 'string' },
  ],
};

export const RefreshTokenRequestDef: MessageDef = {
  fields: [{ no: 1, name: 'refreshToken', type: 'string' }],
};

export const RefreshTokenResponseDef: MessageDef = {
  fields: [
    { no: 1, name: 'accessToken', type: 'string' },
    { no: 2, name: 'expiresIn', type: 'int64' },
  ],
};

export const GetMeRequestDef: MessageDef = {
  fields: [],
};

export const GetMeResponseDef: MessageDef = {
  fields: [
    { no: 1, name: 'user', type: 'message', message: UserInfoDef },
  ],
};

export const LogoutRequestDef: MessageDef = {
  fields: [],
};

export const LogoutResponseDef: MessageDef = {
  fields: [],
};

export const ChangePasswordRequestDef: MessageDef = {
  fields: [
    { no: 1, name: 'oldPassword', type: 'string' },
    { no: 2, name: 'newPassword', type: 'string' },
  ],
};

export const ChangePasswordResponseDef: MessageDef = {
  fields: [],
};

// ── product.proto ─────────────────────────────────────────────

export const SpecFieldDef: MessageDef = {
  fields: [
    { no: 1, name: 'key', type: 'string' },
    { no: 2, name: 'label', type: 'string' },
    { no: 3, name: 'fieldType', type: 'string' },
    { no: 4, name: 'required', type: 'bool' },
    { no: 5, name: 'displayOrder', type: 'uint32' },
    { no: 6, name: 'options', type: 'string', repeated: true },
    { no: 7, name: 'min', type: 'int64' },
    { no: 8, name: 'max', type: 'int64' },
    { no: 9, name: 'defaultValue', type: 'string' },
  ],
};

export const SpecTemplateDef: MessageDef = {
  fields: [
    { no: 1, name: 'fields', type: 'message', message: SpecFieldDef, repeated: true },
  ],
};

export const ProductInfoDef: MessageDef = {
  fields: [
    { no: 1, name: 'id', type: 'string' },
    { no: 2, name: 'name', type: 'string' },
    { no: 3, name: 'description', type: 'string' },
    // reserved: 4, 5, 6, 7, 8, 9
    { no: 10, name: 'price', type: 'string' },
    { no: 11, name: 'providerId', type: 'string' },
    // reserved: 12
    { no: 13, name: 'active', type: 'bool' },
    { no: 14, name: 'createdAt', type: 'string' },
    { no: 15, name: 'updatedAt', type: 'string' },
    { no: 16, name: 'specs', type: 'map', mapValueType: 'string' },
    { no: 17, name: 'groupId', type: 'string' },
    { no: 18, name: 'billingCycles', type: 'map', mapValueType: 'string' },
  ],
};

export const ListProductsRequestDef: MessageDef = {
  fields: [
    { no: 1, name: 'pagination', type: 'message', message: PageRequestDef },
    { no: 2, name: 'providerId', type: 'string' },
    { no: 3, name: 'region', type: 'string' },
    { no: 4, name: 'isActive', type: 'bool' },
    { no: 5, name: 'search', type: 'string' },
    { no: 6, name: 'groupId', type: 'string' },
  ],
};

export const ListProductsResponseDef: MessageDef = {
  fields: [
    { no: 1, name: 'products', type: 'message', message: ProductInfoDef, repeated: true },
    { no: 2, name: 'meta', type: 'message', message: PageMetaDef },
  ],
};

export const GetProductRequestDef: MessageDef = {
  fields: [{ no: 1, name: 'id', type: 'string' }],
};

export const GetProductResponseDef: MessageDef = {
  fields: [{ no: 1, name: 'product', type: 'message', message: ProductInfoDef }],
};

// ── product_group.proto ───────────────────────────────────────

export const ProductGroupInfoDef: MessageDef = {
  fields: [
    { no: 1, name: 'id', type: 'string' },
    { no: 2, name: 'name', type: 'string' },
    { no: 3, name: 'description', type: 'string' },
    { no: 4, name: 'sortOrder', type: 'uint32' },
    { no: 5, name: 'productCount', type: 'uint32' },
    { no: 6, name: 'createdAt', type: 'string' },
    { no: 7, name: 'updatedAt', type: 'string' },
  ],
};

export const ListProductGroupsRequestDef: MessageDef = {
  fields: [{ no: 1, name: 'pagination', type: 'message', message: PageRequestDef }],
};

export const ListProductGroupsResponseDef: MessageDef = {
  fields: [
    { no: 1, name: 'groups', type: 'message', message: ProductGroupInfoDef, repeated: true },
    { no: 2, name: 'meta', type: 'message', message: PageMetaDef },
  ],
};

// ── order.proto ───────────────────────────────────────────────

export const ServerSpecDef: MessageDef = {
  fields: [
    { no: 1, name: 'cpuCores', type: 'uint32' },
    { no: 2, name: 'memoryGb', type: 'uint32' },
    { no: 3, name: 'diskGb', type: 'uint32' },
    { no: 4, name: 'bandwidthMbps', type: 'uint32' },
    { no: 5, name: 'region', type: 'string' },
    { no: 6, name: 'os', type: 'string' },
    { no: 7, name: 'extraSpecs', type: 'map', mapValueType: 'string' },
  ],
};

export const OrderInfoDef: MessageDef = {
  fields: [
    { no: 1, name: 'id', type: 'string' },
    { no: 2, name: 'customerId', type: 'string' },
    { no: 3, name: 'productId', type: 'string' },
    { no: 4, name: 'providerId', type: 'string' },
    { no: 5, name: 'providerInstanceId', type: 'string' },
    { no: 6, name: 'serverSpec', type: 'message', message: ServerSpecDef },
    { no: 7, name: 'status', type: 'string' },
    { no: 8, name: 'amount', type: 'string' },
    { no: 9, name: 'currency', type: 'string' },
    { no: 10, name: 'gatewayId', type: 'string' },
    { no: 11, name: 'gatewayPaymentId', type: 'string' },
    { no: 12, name: 'notes', type: 'string' },
    { no: 13, name: 'createdAt', type: 'string' },
    { no: 14, name: 'updatedAt', type: 'string' },
    { no: 15, name: 'productName', type: 'string' },
    { no: 16, name: 'billingCycle', type: 'string' },
  ],
};

export const CreateOrderRequestDef: MessageDef = {
  fields: [
    { no: 1, name: 'customerId', type: 'string' },
    { no: 2, name: 'productId', type: 'string' },
    { no: 3, name: 'providerId', type: 'string' },
    { no: 4, name: 'serverSpec', type: 'message', message: ServerSpecDef },
    { no: 5, name: 'currency', type: 'string' },
    { no: 6, name: 'gatewayId', type: 'string' },
    { no: 7, name: 'notes', type: 'string' },
    { no: 8, name: 'billingCycle', type: 'string' },
  ],
};

export const PaymentInfoDef: MessageDef = {
  fields: [
    { no: 1, name: 'paymentId', type: 'string' },
    { no: 2, name: 'gatewayId', type: 'string' },
    { no: 3, name: 'paymentUrl', type: 'string' },
    { no: 4, name: 'qrCode', type: 'string' },
    { no: 5, name: 'instructions', type: 'string' },
  ],
};

export const CreateOrderResponseDef: MessageDef = {
  fields: [
    { no: 1, name: 'order', type: 'message', message: OrderInfoDef },
    { no: 2, name: 'payment', type: 'message', message: PaymentInfoDef },
  ],
};

export const ListOrdersRequestDef: MessageDef = {
  fields: [
    { no: 1, name: 'pagination', type: 'message', message: PageRequestDef },
    { no: 2, name: 'customerId', type: 'string' },
    { no: 3, name: 'status', type: 'string' },
    { no: 4, name: 'providerId', type: 'string' },
    { no: 5, name: 'search', type: 'string' },
  ],
};

export const ListOrdersResponseDef: MessageDef = {
  fields: [
    { no: 1, name: 'orders', type: 'message', message: OrderInfoDef, repeated: true },
    { no: 2, name: 'meta', type: 'message', message: PageMetaDef },
  ],
};

export const GetOrderRequestDef: MessageDef = {
  fields: [{ no: 1, name: 'id', type: 'string' }],
};

export const GetOrderResponseDef: MessageDef = {
  fields: [{ no: 1, name: 'order', type: 'message', message: OrderInfoDef }],
};

export const PayOrderRequestDef: MessageDef = {
  fields: [
    { no: 1, name: 'orderId', type: 'string' },
    { no: 2, name: 'gatewayId', type: 'string' },
  ],
};

export const PayOrderResponseDef: MessageDef = {
  fields: [{ no: 1, name: 'payment', type: 'message', message: PaymentInfoDef }],
};

// ── billing.proto ─────────────────────────────────────────────

export const InvoiceItemInfoDef: MessageDef = {
  fields: [
    { no: 1, name: 'id', type: 'string' },
    { no: 2, name: 'description', type: 'string' },
    { no: 3, name: 'quantity', type: 'uint32' },
    { no: 4, name: 'unitPrice', type: 'string' },
    { no: 5, name: 'amount', type: 'string' },
  ],
};

export const InvoiceInfoDef: MessageDef = {
  fields: [
    { no: 1, name: 'id', type: 'string' },
    { no: 2, name: 'invoiceNumber', type: 'string' },
    { no: 3, name: 'customerId', type: 'string' },
    { no: 4, name: 'billingPeriodStart', type: 'string' },
    { no: 5, name: 'billingPeriodEnd', type: 'string' },
    { no: 6, name: 'amount', type: 'string' },
    { no: 7, name: 'taxAmount', type: 'string' },
    { no: 8, name: 'totalAmount', type: 'string' },
    { no: 9, name: 'status', type: 'string' },
    { no: 10, name: 'issuedAt', type: 'string' },
    { no: 11, name: 'paidAt', type: 'string' },
    { no: 12, name: 'dueDate', type: 'string' },
    { no: 13, name: 'notes', type: 'string' },
    { no: 14, name: 'createdAt', type: 'string' },
    { no: 15, name: 'updatedAt', type: 'string' },
    { no: 16, name: 'items', type: 'message', message: InvoiceItemInfoDef, repeated: true },
  ],
};

export const ListInvoicesRequestDef: MessageDef = {
  fields: [
    { no: 1, name: 'pagination', type: 'message', message: PageRequestDef },
    { no: 2, name: 'customerId', type: 'string' },
    { no: 3, name: 'status', type: 'string' },
  ],
};

export const ListInvoicesResponseDef: MessageDef = {
  fields: [
    { no: 1, name: 'invoices', type: 'message', message: InvoiceInfoDef, repeated: true },
    { no: 2, name: 'meta', type: 'message', message: PageMetaDef },
  ],
};

export const GetInvoiceRequestDef: MessageDef = {
  fields: [{ no: 1, name: 'id', type: 'string' }],
};

export const GetInvoiceResponseDef: MessageDef = {
  fields: [{ no: 1, name: 'invoice', type: 'message', message: InvoiceInfoDef }],
};

// ── payment.proto ─────────────────────────────────────────────

export const PaymentRecordDef: MessageDef = {
  fields: [
    { no: 1, name: 'id', type: 'string' },
    { no: 2, name: 'orderId', type: 'string' },
    { no: 3, name: 'invoiceId', type: 'string' },
    { no: 4, name: 'amount', type: 'string' },
    { no: 5, name: 'currency', type: 'string' },
    { no: 6, name: 'gatewayId', type: 'string' },
    { no: 7, name: 'gatewayPaymentId', type: 'string' },
    { no: 8, name: 'gatewayTxId', type: 'string' },
    { no: 9, name: 'status', type: 'string' },
    { no: 10, name: 'paidAt', type: 'string' },
    { no: 11, name: 'createdAt', type: 'string' },
    { no: 12, name: 'updatedAt', type: 'string' },
  ],
};

export const ListPaymentsRequestDef: MessageDef = {
  fields: [
    { no: 1, name: 'pagination', type: 'message', message: PageRequestDef },
    { no: 2, name: 'orderId', type: 'string' },
    { no: 3, name: 'invoiceId', type: 'string' },
    { no: 4, name: 'gatewayId', type: 'string' },
    { no: 5, name: 'status', type: 'string' },
  ],
};

export const ListPaymentsResponseDef: MessageDef = {
  fields: [
    { no: 1, name: 'payments', type: 'message', message: PaymentRecordDef, repeated: true },
    { no: 2, name: 'meta', type: 'message', message: PageMetaDef },
  ],
};

export const GetPaymentRequestDef: MessageDef = {
  fields: [{ no: 1, name: 'id', type: 'string' }],
};

export const GetPaymentResponseDef: MessageDef = {
  fields: [{ no: 1, name: 'payment', type: 'message', message: PaymentRecordDef }],
};

// ── instance.proto ────────────────────────────────────────────

export const InstanceInfoDef: MessageDef = {
  fields: [
    { no: 1, name: 'id', type: 'string' },
    { no: 2, name: 'orderId', type: 'string' },
    { no: 3, name: 'customerId', type: 'string' },
    { no: 4, name: 'productId', type: 'string' },
    { no: 5, name: 'providerId', type: 'string' },
    { no: 6, name: 'providerInstanceId', type: 'string' },
    { no: 7, name: 'status', type: 'string' },
    { no: 8, name: 'ipAddress', type: 'string' },
    { no: 9, name: 'serverSpec', type: 'map', mapValueType: 'string' },
    { no: 10, name: 'productName', type: 'string' },
    { no: 11, name: 'createdAt', type: 'string' },
    { no: 12, name: 'updatedAt', type: 'string' },
  ],
};

export const ListInstancesRequestDef: MessageDef = {
  fields: [
    { no: 1, name: 'pagination', type: 'message', message: PageRequestDef },
    { no: 2, name: 'customerId', type: 'string' },
    { no: 3, name: 'status', type: 'string' },
    { no: 4, name: 'providerId', type: 'string' },
  ],
};

export const ListInstancesResponseDef: MessageDef = {
  fields: [
    { no: 1, name: 'instances', type: 'message', message: InstanceInfoDef, repeated: true },
    { no: 2, name: 'meta', type: 'message', message: PageMetaDef },
  ],
};

export const GetInstanceRequestDef: MessageDef = {
  fields: [{ no: 1, name: 'id', type: 'string' }],
};

export const InstanceDetailFieldDef: MessageDef = {
  fields: [
    { no: 1, name: 'key', type: 'string' },
    { no: 2, name: 'value', type: 'string' },
    { no: 3, name: 'valueType', type: 'string' },
  ],
};

export const InstanceDetailSectionDef: MessageDef = {
  fields: [
    { no: 1, name: 'title', type: 'string' },
    { no: 2, name: 'fields', type: 'message', message: InstanceDetailFieldDef, repeated: true },
    { no: 3, name: 'contentHtml', type: 'string' },
  ],
};

export const InstanceActionDef: MessageDef = {
  fields: [
    { no: 1, name: 'id', type: 'string' },
    { no: 2, name: 'label', type: 'string' },
    { no: 3, name: 'style', type: 'string' },
    { no: 4, name: 'confirmation', type: 'string' },
    { no: 5, name: 'enabled', type: 'bool' },
  ],
};

export const GetInstanceResponseDef: MessageDef = {
  fields: [
    { no: 1, name: 'instance', type: 'message', message: InstanceInfoDef },
    { no: 2, name: 'sections', type: 'message', message: InstanceDetailSectionDef, repeated: true },
    { no: 3, name: 'actions', type: 'message', message: InstanceActionDef, repeated: true },
  ],
};

// ── balance.proto ─────────────────────────────────────────────

export const BalanceTransactionInfoDef: MessageDef = {
  fields: [
    { no: 1, name: 'id', type: 'string' },
    { no: 2, name: 'customerId', type: 'string' },
    { no: 3, name: 'amount', type: 'string' },
    { no: 4, name: 'balanceAfter', type: 'string' },
    { no: 5, name: 'transactionType', type: 'string' },
    { no: 6, name: 'referenceId', type: 'string' },
    { no: 7, name: 'description', type: 'string' },
    { no: 8, name: 'createdAt', type: 'string' },
  ],
};

export const GetBalanceRequestDef: MessageDef = {
  fields: [
    { no: 1, name: 'customerId', type: 'string' },
  ],
};

export const GetBalanceResponseDef: MessageDef = {
  fields: [
    { no: 1, name: 'customerId', type: 'string' },
    { no: 2, name: 'balance', type: 'string' },
    { no: 3, name: 'creditLimit', type: 'string' },
  ],
};

export const ListBalanceTransactionsRequestDef: MessageDef = {
  fields: [
    { no: 1, name: 'pagination', type: 'message', message: PageRequestDef },
    { no: 2, name: 'customerId', type: 'string' },
    { no: 3, name: 'transactionType', type: 'string' },
  ],
};

export const ListBalanceTransactionsResponseDef: MessageDef = {
  fields: [
    { no: 1, name: 'transactions', type: 'message', message: BalanceTransactionInfoDef, repeated: true },
    { no: 2, name: 'meta', type: 'message', message: PageMetaDef },
  ],
};

// ── ticket.proto ──────────────────────────────────────────────

export const TicketReplyInfoDef: MessageDef = {
  fields: [
    { no: 1, name: 'id', type: 'string' },
    { no: 2, name: 'ticketId', type: 'string' },
    { no: 3, name: 'userId', type: 'string' },
    { no: 4, name: 'customerId', type: 'string' },
    { no: 5, name: 'content', type: 'string' },
    { no: 6, name: 'isInternal', type: 'bool' },
    { no: 7, name: 'createdAt', type: 'string' },
  ],
};

export const TicketInfoDef: MessageDef = {
  fields: [
    { no: 1, name: 'id', type: 'string' },
    { no: 2, name: 'customerId', type: 'string' },
    { no: 3, name: 'title', type: 'string' },
    { no: 4, name: 'description', type: 'string' },
    { no: 5, name: 'status', type: 'string' },
    { no: 6, name: 'priority', type: 'string' },
    { no: 7, name: 'assigneeUserId', type: 'string' },
    { no: 8, name: 'creatorUserId', type: 'string' },
    { no: 9, name: 'createdAt', type: 'string' },
    { no: 10, name: 'updatedAt', type: 'string' },
    { no: 11, name: 'replies', type: 'message', message: TicketReplyInfoDef, repeated: true },
  ],
};

export const CreateTicketRequestDef: MessageDef = {
  fields: [
    { no: 1, name: 'customerId', type: 'string' },
    { no: 2, name: 'title', type: 'string' },
    { no: 3, name: 'description', type: 'string' },
    { no: 4, name: 'priority', type: 'string' },
  ],
};

export const CreateTicketResponseDef: MessageDef = {
  fields: [{ no: 1, name: 'ticket', type: 'message', message: TicketInfoDef }],
};

export const ListTicketsRequestDef: MessageDef = {
  fields: [
    { no: 1, name: 'pagination', type: 'message', message: PageRequestDef },
    { no: 2, name: 'customerId', type: 'string' },
    { no: 3, name: 'status', type: 'string' },
    { no: 4, name: 'priority', type: 'string' },
    { no: 5, name: 'assigneeUserId', type: 'string' },
  ],
};

export const ListTicketsResponseDef: MessageDef = {
  fields: [
    { no: 1, name: 'tickets', type: 'message', message: TicketInfoDef, repeated: true },
    { no: 2, name: 'meta', type: 'message', message: PageMetaDef },
  ],
};

export const GetTicketRequestDef: MessageDef = {
  fields: [{ no: 1, name: 'id', type: 'string' }],
};

export const GetTicketResponseDef: MessageDef = {
  fields: [{ no: 1, name: 'ticket', type: 'message', message: TicketInfoDef }],
};

export const CreateReplyRequestDef: MessageDef = {
  fields: [
    { no: 1, name: 'ticketId', type: 'string' },
    { no: 2, name: 'content', type: 'string' },
    { no: 3, name: 'isInternal', type: 'bool' },
  ],
};

export const CreateReplyResponseDef: MessageDef = {
  fields: [{ no: 1, name: 'reply', type: 'message', message: TicketReplyInfoDef }],
};

// ── integration.proto ─────────────────────────────────────────

export const ProviderInfoDef: MessageDef = {
  fields: [
    { no: 1, name: 'providerId', type: 'string' },
    { no: 2, name: 'providerName', type: 'string' },
    { no: 3, name: 'providerType', type: 'string' },
    { no: 4, name: 'isHealthy', type: 'bool' },
    { no: 5, name: 'specTemplate', type: 'message', message: SpecTemplateDef },
  ],
};

export const ListProvidersResponseDef: MessageDef = {
  fields: [
    { no: 1, name: 'providers', type: 'message', message: ProviderInfoDef, repeated: true },
  ],
};

export const GatewayInfoDef: MessageDef = {
  fields: [
    { no: 1, name: 'gatewayId', type: 'string' },
    { no: 2, name: 'gatewayName', type: 'string' },
    { no: 3, name: 'isHealthy', type: 'bool' },
  ],
};

export const ListGatewaysResponseDef: MessageDef = {
  fields: [
    { no: 1, name: 'gateways', type: 'message', message: GatewayInfoDef, repeated: true },
  ],
};

// ── downstream.proto · ApiKeyService ──────────────────────────────

export const CreateApiKeyRequestDef: MessageDef = {
  fields: [
    { name: 'name', type: 'string', no: 1 },
    { name: 'customerId', type: 'string', no: 2 },
  ],
};

export const CreateApiKeyResponseDef: MessageDef = {
  fields: [
    { name: 'apiKey', type: 'string', no: 1 },
    { name: 'keyPrefix', type: 'string', no: 2 },
    { name: 'id', type: 'string', no: 3 },
  ],
};

export const ListApiKeysRequestDef: MessageDef = {
  fields: [{ name: 'customerId', type: 'string', no: 1 }],
};

export const ApiKeyInfoDef: MessageDef = {
  fields: [
    { name: 'id', type: 'string', no: 1 },
    { name: 'keyPrefix', type: 'string', no: 2 },
    { name: 'name', type: 'string', no: 3 },
    { name: 'enabled', type: 'bool', no: 4 },
    { name: 'createdAt', type: 'string', no: 5 },
    { name: 'lastUsedAt', type: 'string', no: 6 },
    { name: 'expiresAt', type: 'string', no: 7 },
  ],
};

export const ListApiKeysResponseDef: MessageDef = {
  fields: [{ name: 'keys', type: 'message', message: ApiKeyInfoDef, repeated: true, no: 1 }],
};

export const RevokeApiKeyRequestDef: MessageDef = {
  fields: [{ name: 'id', type: 'string', no: 1 }],
};

export const RevokeApiKeyResponseDef: MessageDef = {
  fields: [],
};
