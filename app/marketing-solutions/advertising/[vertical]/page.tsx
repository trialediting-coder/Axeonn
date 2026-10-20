// /marketing-solutions/advertising/{dental|med-spa|law-firms|accounting}: the funnel page for one practice type.
import { funnelRoute } from '@/components/marketing-solutions/FunnelPage';

const route = funnelRoute('advertising');

export const dynamicParams = false;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
