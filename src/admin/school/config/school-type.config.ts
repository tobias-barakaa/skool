export const SCHOOL_TYPES_CONFIG = {
    CBC: {
      name: "CBC School",
      description: "A complete school offering education from pre-primary through senior secondary under the CBC",
      icon: "🏫",
      priority: 4,
      menuItems: ["Home", "School", "Teachers", "Students", "Attendance", "Grading", "Library", "Finance"],
      levels: {
        "pre-primary": {
          name: "Pre-primary",
          description: "Early childhood education for ages 4-5",
          grades: [
            { name: "Early Childhood", age: 3 },
            { name: "PP1", age: 4 },
            { name: "PP2", age: 5 }
          ]
        },
        "lower-primary": {
          name: "Lower Primary",
          description: "Foundation stage for ages 6-8",
          grades: [
            { name: "Grade 1", age: 6 },
            { name: "Grade 2", age: 7 },
            { name: "Grade 3", age: 8 }
          ]
        },
        "upper-primary": {
          name: "Upper Primary",
          description: "Intermediate stage for ages 9-11",
          grades: [
            { name: "Grade 4", age: 9 },
            { name: "Grade 5", age: 10 },
            { name: "Grade 6", age: 11 }
          ]
        },
        "junior-secondary": {
          name: "Junior Secondary",
          description: "Middle school stage for ages 12-14",
          grades: [
            { name: "Grade 7", age: 12 },
            { name: "Grade 8", age: 13 },
            { name: "Grade 9", age: 14 }
          ]
        },
        "senior-secondary": {
          name: "Senior Secondary",
          description: "Advanced stage for ages 15-17",
          grades: [
            { name: "Grade 10", age: 15 },
            { name: "Grade 11", age: 16 },
            { name: "Grade 12", age: 17 }
          ]
        }
      }
    },
    INTERNATIONAL: {
      name: "International School",
      description: "An international school in Kenya offers global curricula such as IGCSE, IB, or American",
      icon: "🌍",
      priority: 4,
      menuItems: ["Home", "School", "Teachers", "Students", "Attendance", "Grading", "International Programs"],
      levels: {
        "igcse-early-years": {
          name: "IGCSE Early Years",
          description: "British curriculum early years",
          grades: [
            { name: "Nursery", age: 3 },
            { name: "Reception", age: 4 }
          ]
        },
        "igcse-primary": {
          name: "IGCSE Primary",
          description: "British curriculum primary",
          grades: [
            { name: "Year 1", age: 5 },
            { name: "Year 2", age: 6 },
            { name: "Year 3", age: 7 },
            { name: "Year 4", age: 8 },
            { name: "Year 5", age: 9 },
            { name: "Year 6", age: 10 }
          ]
        },
        "igcse-secondary": {
          name: "IGCSE Secondary",
          description: "British curriculum secondary",
          grades: [
            { name: "Year 7", age: 11 },
            { name: "Year 8", age: 12 },
            { name: "Year 9", age: 13 },
            { name: "Year 10", age: 14 },
            { name: "Year 11", age: 15 }
          ]
        },
        "a-level": {
          name: "A-Level",
          description: "Advanced level studies",
          grades: [
            { name: "Year 12", age: 16 },
            { name: "Year 13", age: 17 }
          ]
        }
      }
    },
    MADRASA: {
      name: "Madrasa / Faith-based School",
      description: "These schools combine religious instruction with academic education",
      icon: "🕌",
      priority: 2,
      menuItems: ["Home", "School", "Teachers", "Students", "Attendance", "Islamic Studies", "Quran"],
      levels: {
        "pre-primary": {
          name: "Pre-primary",
          description: "Early childhood education with religious foundation",
          grades: [
            { name: "Early Childhood", age: 3 },
            { name: "PP1", age: 4 },
            { name: "PP2", age: 5 }
          ]
        },
        "lower-primary": {
          name: "Lower Primary",
          description: "Foundation stage with religious instruction",
          grades: [
            { name: "Grade 1", age: 6 },
            { name: "Grade 2", age: 7 },
            { name: "Grade 3", age: 8 }
          ]
        },
        "upper-primary": {
          name: "Upper Primary",
          description: "Intermediate stage with religious education",
          grades: [
            { name: "Grade 4", age: 9 },
            { name: "Grade 5", age: 10 },
            { name: "Grade 6", age: 11 }
          ]
        },
        "junior-secondary": {
          name: "Junior Secondary",
          description: "Middle school stage with religious studies integration",
          grades: [
            { name: "Grade 7", age: 12 },
            { name: "Grade 8", age: 13 },
            { name: "Grade 9", age: 14 }
          ]
        },
        "senior-secondary": {
          name: "Senior Secondary",
          description: "Advanced stage with specialized religious education",
          grades: [
            { name: "Grade 10", age: 15 },
            { name: "Grade 11", age: 16 },
            { name: "Grade 12", age: 17 }
          ]
        }
      }
      
    },
    HOMESCHOOL: {
      name: "Homeschool",
      description: "Parents or tutors educating children at home using international curricula",
      icon: "🏠",
      priority: 2,
      menuItems: ["Home", "Curriculum", "Lessons", "Assessment", "Reports"],
      levels: {
        "elementary": {
          name: "Elementary",
          description: "Basic education foundation",
          grades: [
            { name: "Grade 1", age: 6 },
            { name: "Grade 2", age: 7 },
            { name: "Grade 3", age: 8 },
            { name: "Grade 4", age: 9 },
            { name: "Grade 5", age: 10 }
          ]
        },
        "middle-school": {
          name: "Middle School",
          description: "Intermediate education",
          grades: [
            { name: "Grade 6", age: 11 },
            { name: "Grade 7", age: 12 },
            { name: "Grade 8", age: 13 }
          ]
        },
        "high-school": {
          name: "High School",
          description: "Advanced secondary education",
          grades: [
            { name: "Grade 9", age: 14 },
            { name: "Grade 10", age: 15 },
            { name: "Grade 11", age: 16 },
            { name: "Grade 12", age: 17 }
          ]
        }
      }
    }
  };