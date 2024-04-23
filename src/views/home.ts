import { DataviewInlineApi } from '../../lib/dv-types/api/inline-api'
import { today as getToday, oneMonthAgo, future } from '../utils/dates'
import * as tasks from '../utils/tasks'
import * as formatter from '../utils/formatter'
import { durationSum } from '../utils/durations'


export default (dv: DataviewInlineApi) => {
	const today = getToday(dv)
	

	// # QUERIES

	const dailyNotes = dv.pages('"Documents/Daily"')
	const cards = dv.pages('"Cards"')

	const quickTasks = dailyNotes
		.filter(x => dv.date(`20${x.file.name}`) > oneMonthAgo(dv))
		.sort(x => x.file.name, 'desc')
		.map(x => x.file.tasks.filter(task => !task.completed))
		.filter(x => x.length)
	;


	const allTasks = tasks.getTasks(dv)

	const dueTasks = tasks.getDueTasks(dv)

	const completed = allTasks
		.filter(x => x.done && x.done >= today)
		.sort(x => x.link)
	;

	const dueToday = dueTasks
		.filter(x => x.due <= today)
		.sort(x => x.time + x.prio + x.due.toString())
	;

	const dueWhenever = dueTasks
		.filter(x => x.due > today && x.due < future(dv))
		.sort(x => x.due.toString() + x.prio)
	;

	const dueTodayView = dueToday
		.map(x => formatter.iconizePrio(x))
		.map(x => formatter.iconizeTime(x))
		.map(x => ({ ...x, time: `${x.time} ${tasks.getOverdueAmount(dv, x)}` }))
	;

	const dueWheneverView = dueWhenever
		.map(x => formatter.iconizePrio(x))
	;

	const scheduledTasksView = dueWheneverView.filter(x => !!(x.dur || x.repeat))

	const scheduledGoalsView = dueWheneverView.filter(x => !(x.dur || x.repeat))


	const workDuration = durationSum(dv, dueToday)

	const completedDuration = durationSum(dv, completed)


	const pinnedCards = cards
		.filter(card => card.props
			?.map(flow => flow?.path)
			.some(path => path?.includes('Pinned'))
		)
		.map(x => x.file.link)
		.array()
		.sort()
	;


	// # RENDERING

	dv.header(1, today)

	dv.header(1, pinnedCards.join(' | '))

	dv.header(2, 'Due Today')

	dv.paragraph(workDuration)

	dv.table(['Task', 'Time', 'Prio', 'Duration'],
		dueTodayView.map(x => [x.link, x.time, x.prio, x.dur])
	)

	dv.header(3, 'Completed Today')

	dv.paragraph(completedDuration)

	dv.table(['Task', 'Duration'],
		completed.map(x => [x.link, x.dur])
	)

	dv.header(2, 'Quick Tasks')

	quickTasks.forEach(x => {
		dv.taskList(x)
		dv.el('br', null)
	})

	dv.header(2, 'Scheduled Tasks')

	dv.table(['Task', 'Due', 'Prio'],
		scheduledTasksView.map(x => [x.link, x.due, x.prio])
	)

	dv.header(2, 'Goals')

	dv.table(['Task', 'Due', 'Prio'],
		scheduledGoalsView.map(x => [x.link, x.due, x.prio])
	)
}