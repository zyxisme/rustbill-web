import type { Config } from 'vike/types';
import vikeReact from 'vike-react/config';

export default {
  ssr: false,
  extends: [vikeReact],
  passToClient: ['brandConfig'],
} satisfies Config;
