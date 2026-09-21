import { generateDemoData } from "@/lib/demoData";
import EndpointDetailClient from "@/components/EndpointDetail/EndpointDetailClient";

export function generateStaticParams() {
  const { endpoints } = generateDemoData();
  return endpoints.map((e) => ({ id: e.id }));
}

export default function EndpointDetailPage({ params }: { params: { id: string } }) {
  return <EndpointDetailClient id={params.id} />;
}
