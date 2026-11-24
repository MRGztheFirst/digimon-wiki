import { AdminTitle, Flash } from "../../_components/form";
import { MediaForm } from "../media-form";
import type { SP } from "../../_lib";

export default async function NewMedia({ searchParams }: { searchParams: SP }) {
  const { erro } = await searchParams;
  return (
    <div className="mx-auto max-w-5xl">
      <AdminTitle title="Nova obra" />
      <Flash erro={erro} />
      <MediaForm />
    </div>
  );
}
