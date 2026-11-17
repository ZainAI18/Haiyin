import { notFound } from "next/navigation";
import { ProcessView } from "@/components/process-view";
import { scenes } from "@/components/scene-data";
import { sceneIds, type SceneId } from "@/lib/domain";
type Props={ params: Promise<{scene:string}> };
export function generateStaticParams() {return sceneIds.map(scene=>({scene}));}
export async function generateMetadata({params}:Props) {
  const {scene}=await params;
  return sceneIds.includes(scene as SceneId) ? {title:scenes[scene as SceneId].title} : {};
}
export default async function SceneRoute({params}:Props) {
  const {scene}=await params;
  if (!sceneIds.includes(scene as SceneId)) notFound();
  return <ProcessView key={scene} scene={scene as SceneId}/>;
}
