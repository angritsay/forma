/**
 * «Мои курсы» (0065): a creator's own courses, from «Кабинет автора». The admin's course list in
 * the creator's scope — see `CourseListScreen` and `builderScope.ts`.
 */
import { CourseListScreen } from './AdminCoursesScreen';

export default function CreatorCoursesScreen() {
  return <CourseListScreen mode="creator" />;
}
