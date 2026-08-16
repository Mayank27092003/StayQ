import PropertyDashboardClient from "./PropertyDashboardClient";

export function generateStaticParams() {
  return [{ id: "preview" }];
}

export default function PropertyPage() {
  return <PropertyDashboardClient />;
}
