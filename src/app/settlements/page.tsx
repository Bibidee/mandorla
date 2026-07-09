import { getAllCases } from "@/lib/contractData";
import { SettlementsClient } from "./SettlementsClient";

export const dynamic = "force-dynamic";

export default async function SettlementsPage() {
  const all = await getAllCases();
  const settled = all.filter(c => (c.status === "resolved" || c.status === "settled") && c.final_result);
  return <SettlementsClient settled={settled} />;
}
