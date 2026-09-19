/**
 * Кто что может открыть в курсе. Чистый модуль, покрыт тестами.
 *
 * До этого «можно» значило «куплен», и проверка стояла в четырёх местах: список курсов, путь,
 * превью узла и — единственная настоящая — insert-политика `workout_sessions`. Три из четырёх
 * давали один и тот же ответ разными словами, и когда правило усложнилось, они бы разошлись.
 *
 * Правило теперь такое: **первая тренировка курса бесплатна, и ровно одна.** Оно совпадает с тем,
 * что делает база (`can_try_course()` в 0019): проба живёт, пока на курсе нет ни одной завершённой
 * сессии. Здесь она считается по тому же признаку, и это осознанно — клиент не изобретает свою
 * версию правила, он показывает серверную.
 *
 * Разница ровно одна, и она в пользу строгости: база не знает порядка узлов и разрешила бы пробу на
 * любом из них, а здесь бесплатен только первый. Так человек не может случайно потратить
 * единственную бесплатную тренировку на день двадцатый, открыв его из ссылки.
 */
import type { Course, CourseNode } from '@/content/schema';

export type CourseAccess =
  /** Куплен или открыт подпиской: всё доступно. */
  | 'owned'
  /** Не куплен, проба цела — первый узел открыт. */
  | 'trial'
  /** Не куплен, проба потрачена — открыть можно только оплатой. */
  | 'spent';

export interface CourseAccessInput {
  /** Есть ли активная покупка / подписка на этот курс. */
  owned: boolean;
  /** Завершена ли хотя бы одна тренировка этого курса. */
  hasCompleted: boolean;
}

export function courseAccess({ owned, hasCompleted }: CourseAccessInput): CourseAccess {
  if (owned) return 'owned';
  return hasCompleted ? 'spent' : 'trial';
}

/**
 * Первый узел, который вообще можно тренировать, — им и открывается проба.
 *
 * Не `nodes[0]`: у курса первым может стоять день отдыха или веха, а они не тренировки и пробу не
 * тратят. У «Формы с нуля» первый узел и так тренировка (вступительного теста в ней нет), но это
 * свойство одного курса, а не правило.
 */
export function firstTrainableNode(course: Course): CourseNode | null {
  return course.nodes.find((n) => n.kind !== 'rest' && n.kind !== 'milestone') ?? null;
}

export interface NodeAccessInput extends CourseAccessInput {
  course: Course;
  node: CourseNode;
}

/**
 * Можно ли открыть этот узел — и если нет, то потому что за него не заплачено.
 *
 * `'paywalled'` отделён от «ещё не дошёл» намеренно: это разные тупики и вести из них надо в разные
 * места. Запертый порядком узел говорит «сначала пройди предыдущие», запертый оплатой — открывает
 * шторку с ценой.
 */
export function nodeAccess(input: NodeAccessInput): 'open' | 'paywalled' {
  const access = courseAccess(input);
  if (access === 'owned') return 'open';
  const first = firstTrainableNode(input.course);
  if (first && first.id === input.node.id && access === 'trial') return 'open';
  return 'paywalled';
}

/**
 * Потрачена ли проба — по ответу сервера, а не по локальному окну сессий.
 *
 * `recentSessions` в сторе прогресса — это двадцать последних записей. Человек, сделавший пробу
 * месяц назад и с тех пор много тренировавшийся, из этого окна выпадает, и экран предложил бы ему
 * «Попробовать», а политика отказала бы во вставке. Поэтому источник — `my_trained_courses()`
 * (0019): тот же признак, по которому решает `can_try_course()`, посчитанный по всем строкам.
 */
export function hasCompletedIn(trainedCourseIds: readonly string[], courseId: string): boolean {
  return trainedCourseIds.includes(courseId);
}
