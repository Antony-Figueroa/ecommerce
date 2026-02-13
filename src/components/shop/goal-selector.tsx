import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Zap, 
  Moon, 
  Dumbbell, 
  ShieldCheck, 
  Brain, 
  Flame,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Trophy,
  Target
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const goals = [
  {
    id: "energy",
    title: "Energía & Foco",
    description: "Potencia tu día y concentración",
    icon: Zap,
    color: "bg-amber-500",
    lightColor: "bg-amber-50 dark:bg-amber-500/10",
    textColor: "text-amber-600 dark:text-amber-400",
    query: "energia",
    questions: [
      {
        id: "level",
        text: "¿Cuál es tu nivel de actividad diaria?",
        options: [
          { label: "Sedentario / Oficina", value: "bajo", icon: "💻" },
          { label: "Moderado / Activo", value: "medio", icon: "🏃" },
          { label: "Intenso / Atleta", value: "alto", icon: "⚡" }
        ]
      },
      {
        id: "preference",
        text: "¿Prefieres estimulantes (cafeína)?",
        options: [
          { label: "Sí, dame energía extra", value: "con-estimulantes", icon: "☕" },
          { label: "No, prefiero algo natural", value: "sin-estimulantes", icon: "🌿" }
        ]
      }
    ]
  },
  {
    id: "performance",
    title: "Rendimiento",
    description: "Maximiza tus entrenamientos",
    icon: Dumbbell,
    color: "bg-blue-600",
    lightColor: "bg-blue-50 dark:bg-blue-500/10",
    textColor: "text-blue-600 dark:text-blue-400",
    query: "rendimiento",
    questions: [
      {
        id: "type",
        text: "¿Qué tipo de ejercicio realizas?",
        options: [
          { label: "Fuerza / Pesas", value: "fuerza", icon: "🏋️" },
          { label: "Resistencia / Cardio", value: "resistencia", icon: "🚴" },
          { label: "Funcional / HIIT", value: "funcional", icon: "🔥" }
        ]
      }
    ]
  },
  {
    id: "recovery",
    title: "Recuperación",
    description: "Repara y descansa mejor",
    icon: Moon,
    color: "bg-indigo-600",
    lightColor: "bg-indigo-50 dark:bg-indigo-500/10",
    textColor: "text-indigo-600 dark:text-indigo-400",
    query: "recuperacion",
    questions: [
      {
        id: "focus",
        text: "¿En qué área necesitas más apoyo?",
        options: [
          { label: "Dolor Muscular", value: "muscular", icon: "🩹" },
          { label: "Calidad de Sueño", value: "sueno", icon: "😴" },
          { label: "Reducción de Estrés", value: "estres", icon: "🧘" }
        ]
      }
    ]
  },
  {
    id: "immunity",
    title: "Inmunidad",
    description: "Refuerza tus defensas",
    icon: ShieldCheck,
    color: "bg-emerald-600",
    lightColor: "bg-emerald-50 dark:bg-emerald-500/10",
    textColor: "text-emerald-600 dark:text-emerald-400",
    query: "inmunidad",
    questions: [
        {
          id: "age",
          text: "¿Para quién es el suplemento?",
          options: [
            { label: "Adulto Joven", value: "joven", icon: "🧒" },
            { label: "Adulto Mayor", value: "senior", icon: "👴" },
            { label: "Toda la familia", value: "familia", icon: "👨‍👩‍👧‍👦" }
          ]
        }
      ]
  },
  {
    id: "weight-loss",
    title: "Control de Peso",
    description: "Alcanza tu peso ideal",
    icon: Flame,
    color: "bg-rose-600",
    lightColor: "bg-rose-50 dark:bg-rose-500/10",
    textColor: "text-rose-600 dark:text-rose-400",
    query: "peso",
    questions: [
      {
        id: "method",
        text: "¿Cuál es tu enfoque principal?",
        options: [
          { label: "Quemar Grasa", value: "quemador", icon: "🔥" },
          { label: "Control de Apetito", value: "saciante", icon: "🍽️" },
          { label: "Detox / Retención", value: "detox", icon: "💧" }
        ]
      }
    ]
  },
  {
    id: "mental-health",
    title: "Salud Mental",
    description: "Equilibrio y bienestar",
    icon: Brain,
    color: "bg-purple-600",
    lightColor: "bg-purple-50 dark:bg-purple-500/10",
    textColor: "text-purple-600 dark:text-purple-400",
    query: "bienestar",
    questions: [
      {
        id: "need",
        text: "¿Qué buscas mejorar hoy?",
        options: [
          { label: "Claridad Mental", value: "nootropico", icon: "🧠" },
          { label: "Estado de Ánimo", value: "animo", icon: "✨" },
          { label: "Paz Interior", value: "relajacion", icon: "🌊" }
        ]
      }
    ]
  }
]

export function GoalSelector() {
  const navigate = useNavigate()
  const [selectedGoal, setSelectedGoal] = useState<typeof goals[0] | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const handleGoalSelect = (goal: typeof goals[0]) => {
    setSelectedGoal(goal)
    setCurrentQuestionIndex(0)
    setAnswers({})
  }

  const handleOptionSelect = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value }
    setAnswers(newAnswers)

    if (selectedGoal && currentQuestionIndex < selectedGoal.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // Finalizar Quiz
      const queryParams = new URLSearchParams()
      queryParams.set('search', selectedGoal?.query || '')
      Object.entries(newAnswers).forEach(([_, val]) => {
        queryParams.append('tags', val)
      })
      navigate(`/productos?${queryParams.toString()}`)
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    } else {
      setSelectedGoal(null)
    }
  }

  return (
    <section className="py-24 bg-white dark:bg-[#0A0A0A] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <AnimatePresence mode="wait">
          {!selectedGoal ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-16"
            >
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-4"
                >
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  Experiencia Personalizada
                </motion.div>
                <h2 className="text-5xl md:text-6xl font-black tracking-tight text-slate-800 dark:text-white italic leading-tight">
                  Tu Bienestar, <span className="text-primary not-italic">Tu Estrategia</span>
                </h2>
                <p className="text-slate-500 dark:text-muted-foreground font-medium text-lg max-w-2xl mx-auto">
                  No todos los cuerpos son iguales. Responde 2 preguntas y diseñaremos tu stack ideal.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {goals.map((goal, index) => (
                  <motion.button
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleGoalSelect(goal)}
                    className="group relative flex flex-col p-8 rounded-[3rem] bg-slate-50 dark:bg-slate-900/40 border-2 border-transparent hover:border-primary/20 hover:bg-white dark:hover:bg-slate-900 transition-all duration-500 text-left shadow-sm hover:shadow-2xl overflow-hidden"
                  >
                    <div className={cn(
                      "w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
                      goal.lightColor,
                      goal.textColor
                    )}>
                      <goal.icon className="w-10 h-10" />
                    </div>
                    
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 group-hover:text-primary transition-colors">
                      {goal.title}
                    </h3>
                    <p className="text-slate-500 dark:text-muted-foreground font-medium mb-6">
                      {goal.description}
                    </p>

                    <div className="mt-auto flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                      Comenzar Quiz <ChevronRight className="w-4 h-4" />
                    </div>

                    <div className={cn(
                      "absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500",
                      goal.color
                    )} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[4rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 md:p-16 relative overflow-hidden">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-2 bg-slate-100 dark:bg-slate-800">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestionIndex + 1) / selectedGoal.questions.length) * 100}%` }}
                  />
                </div>

                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="mb-8 -ml-4 text-slate-400 hover:text-primary transition-colors"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                </Button>

                <div className="flex items-center gap-4 mb-8">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    selectedGoal.lightColor,
                    selectedGoal.textColor
                  )}>
                    <selectedGoal.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-primary">Objetivo: {selectedGoal.title}</span>
                    <h4 className="text-sm text-slate-500 font-bold italic">Paso {currentQuestionIndex + 1} de {selectedGoal.questions.length}</h4>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-10"
                  >
                    <h3 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 dark:text-white leading-tight">
                      {selectedGoal.questions[currentQuestionIndex].text}
                    </h3>

                    <div className="grid gap-4">
                      {selectedGoal.questions[currentQuestionIndex].options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleOptionSelect(selectedGoal.questions[currentQuestionIndex].id, option.value)}
                          className="flex items-center gap-6 p-6 rounded-3xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary hover:bg-primary/5 transition-all duration-300 group text-left"
                        >
                          <span className="text-4xl group-hover:scale-110 transition-transform">{option.icon}</span>
                          <span className="text-lg font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">
                            {option.label}
                          </span>
                          <ChevronRight className="ml-auto w-6 h-6 text-slate-300 group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Quiz Footer Decoration */}
              <div className="mt-12 flex justify-center gap-12 text-slate-400">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-tighter">Resultados Optimizados</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-tighter">Precisión Científica</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
