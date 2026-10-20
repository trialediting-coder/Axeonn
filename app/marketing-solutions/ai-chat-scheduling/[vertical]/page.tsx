// /marketing-solutions/ai-chat-scheduling/{dental|med-spa|law-firms|accounting}: the funnel page for one practice type.
import { funnelRoute } from '@/components/marketing-solutions/FunnelPage';

const route = funnelRoute('ai-chat-scheduling');

export const dynamicParams = false;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
