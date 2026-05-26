import type { Config } from 'vike/types';
import vikeReact from 'vike-react/config';

export default {
  ssr: true,
  extends: [vikeReact],
  passToClient: ['brandConfig'],
} satisfies Config;
