import { GenerationWorkbench } from "@/components/layout/GenerationWorkbench";

export const metadata = {
  title: "Image generation"
};

export default function ImagePage() {
  return <GenerationWorkbench mode="image" />;
}
