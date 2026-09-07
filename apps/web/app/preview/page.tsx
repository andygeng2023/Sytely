import { redirect } from "next/navigation";

export default function PreviewPage() {
  redirect("/mysites");
}

//Old preview page 
// > redirects to /mysites