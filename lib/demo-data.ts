export type DemoProject = {
  id: string
  name: string
  status: "Not Started" | "In Progress" | "Blocked" | "Completed"
  progress: number
  startDate: string
  dueDate: string
  builderName: string
  budget: number
  spent: number
}

export type DemoNotification = {
  id: string
  message: string
  role: "parent" | "student" | "builder"
  createdAt: string
}

export const demoProjects: DemoProject[] = [
  {
    id: "p1",
    name: "Science Fair Volcano",
    status: "In Progress",
    progress: 62,
    startDate: "2025-08-01",
    dueDate: "2025-09-10",
    builderName: "BrightBuild Co.",
    budget: 200,
    spent: 120,
  },
  {
    id: "p2",
    name: "History Diorama",
    status: "Not Started",
    progress: 0,
    startDate: "2025-09-05",
    dueDate: "2025-10-01",
    builderName: "Makers Hub",
    budget: 150,
    spent: 0,
  },
]

export const demoNotifications: DemoNotification[] = [
  { id: "n1", message: "Builder uploaded 3 new photos for Science Fair Volcano", role: "parent", createdAt: "2h ago" },
  { id: "n2", message: "Payment approved by Parent for Science Fair Volcano", role: "student", createdAt: "1d ago" },
  { id: "n3", message: "New request assigned: History Diorama", role: "builder", createdAt: "3d ago" },
]

export const demoReviews = [
  { id: "r1", builder: "BrightBuild Co.", rating: 5, text: "Exceptional quality and communication." },
  { id: "r2", builder: "Makers Hub", rating: 4, text: "On time delivery, room to improve photos." },
]
