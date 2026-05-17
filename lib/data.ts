export type BuildingKey = "A" | "B" | "C" | "D" | "Library";

export interface Building {
  key: BuildingKey;
  name: string;
  rooms: string[];
  sub: string;
}

export const BUILDINGS: Building[] = [
  {
    key: "A",
    name: "Block A",
    sub: "2 auditoriums · 3 classrooms",
    rooms: ["Auditorium A1", "Auditorium A2", "Classroom A1", "Classroom A2", "Classroom A3"],
  },
  {
    key: "B",
    name: "Block B",
    sub: "4 classrooms",
    rooms: ["Classroom B1", "Classroom B2", "Classroom B3", "Classroom B4"],
  },
  {
    key: "C",
    name: "Block C",
    sub: "2 auditoriums · 3 classrooms",
    rooms: ["Auditorium C1", "Auditorium C2", "Classroom C1", "Classroom C2", "Classroom C3"],
  },
  {
    key: "D",
    name: "Block D",
    sub: "4 classrooms",
    rooms: ["Classroom D1", "Classroom D2", "Classroom D3", "Classroom D4"],
  },
  {
    key: "Library",
    name: "Library",
    sub: "15 discussion rooms",
    rooms: Array.from({ length: 15 }, (_, i) => `Discussion Room L${i + 1}`),
  },
];

export const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
];
