/**
 * One of a creator's own courses (0065): the admin's course editor in the creator's scope, with
 * «Отправить на проверку» where the owner has «Опубликовать». See `CourseEditorScreen`.
 */
import { CourseEditorScreen } from './AdminCourseScreen';

export default function CreatorCourseScreen() {
  return <CourseEditorScreen mode="creator" />;
}
