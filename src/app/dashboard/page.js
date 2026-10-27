import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import DashboardContent from "@/components/DashboardContent";

export default async function DashboardPage() {
    const user = await getSession();

    if (!user) {
        redirect("/login");
    }

    return <DashboardContent user={user} />;
}
