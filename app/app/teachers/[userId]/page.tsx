import { TeacherDetail } from "@/components/app/teacher-detail";

export default async function TeacherDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <TeacherDetail userId={userId} />;
}
