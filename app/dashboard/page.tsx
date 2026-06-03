import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;

  if (role === "ADMIN") {
    redirect("/admin");
  }

  if (role === "SELLER") {
    redirect("/seller");
  }

  if (role === "BUYER") {
    redirect("/buyer");
  }

  redirect("/login");
}