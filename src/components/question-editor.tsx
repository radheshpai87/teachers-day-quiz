'use client'

import { useState } from 'react'
import type { Question, QuestionType, TimerChoice } from '@/lib/types'
import { TIMER_CHOICES } from '@/lib/types'
import { apiPost, apiPut, apiDelete } from '@/lib/client/api'
import { PaperClip } from '@/components/icons'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2, Copy, Edit3, Image as ImageIcon, Check, X } from 'lucide-react'

interface QuestionEditorProps {
  quizId: string
  initialQuestions: Question[]
  onQuestionsChange: (questions: Question[]) => void
}

function SortableQuestionRow({
  question,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  question: Question
  onEdit: (q: Question) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: question.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 rounded-xl border-2 border-ink bg-paper-cream flex items-center justify-between gap-3 shadow-[2px_2px_0px_#2a2440] hover:shadow-[4px_4px_0px_#2a2440] transition-all"
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 text-ink-soft hover:text-ink cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md sticky-note-lavender border border-ink text-ink text-[10px] font-black uppercase">
              {question.type}
            </span>
            <span className="px-2 py-0.5 rounded-md sticky-note-yellow border border-ink text-ink text-[10px] font-black">
              {question.timerSeconds || 5}s
            </span>
          </div>
          <p className="font-extrabold text-ink text-sm sm:text-base line-clamp-1">
            {question.prompt}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(question)}
          className="p-2 rounded-xl sticky-note-lavender border border-ink text-ink hover:-translate-y-0.5 transition-all cursor-pointer shadow-[1px_1px_0px_#2a2440]"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDuplicate(question.id)}
          className="p-2 rounded-xl sticky-note-yellow border border-ink text-ink hover:-translate-y-0.5 transition-all cursor-pointer shadow-[1px_1px_0px_#2a2440]"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(question.id)}
          className="p-2 rounded-xl sticky-note-rose border border-ink text-ink hover:-translate-y-0.5 transition-all cursor-pointer shadow-[1px_1px_0px_#2a2440]"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function QuestionEditor({
  quizId,
  initialQuestions,
  onQuestionsChange,
}: QuestionEditorProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = questions.findIndex((q) => q.id === active.id)
    const newIndex = questions.findIndex((q) => q.id === over.id)

    if (oldIndex < 0 || newIndex < 0) return

    const reordered = [...questions]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    setQuestions(reordered)
    onQuestionsChange(reordered)

    try {
      await apiPost('/api/admin/questions/reorder', {
        orderedIds: reordered.map((q) => q.id),
      })
    } catch {
      setQuestions(questions)
    }
  }

  const handleCreateNew = () => {
    setEditingQuestion({
      quizId,
      type: 'MCQ',
      prompt: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      timerSeconds: 5,
      explanation: '',
      imageId: null,
    })
  }

  const handleDuplicate = async (id: string) => {
    try {
      const res = await apiPost<{ question: Question }>(`/api/admin/questions/${id}/duplicate`)
      const updated = [...questions, res.question]
      setQuestions(updated)
      onQuestionsChange(updated)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Duplicate failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return
    try {
      await apiDelete(`/api/admin/questions/${id}`)
      const updated = questions.filter((q) => q.id !== id)
      setQuestions(updated)
      onQuestionsChange(updated)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      setEditingQuestion((prev) => (prev ? { ...prev, imageId: data.imageId } : null))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSaveModal = async () => {
    if (!editingQuestion) return
    if (!editingQuestion.prompt?.trim()) {
      alert('Question prompt is required')
      return
    }

    if (editingQuestion.type === 'IMAGE' && !editingQuestion.imageId) {
      alert('Please upload an image for this Image Question')
      return
    }

    try {
      setIsSaving(true)

      let saved: Question
      if (editingQuestion.id) {
        const res = await apiPut<{ question: Question }>(
          `/api/admin/questions/${editingQuestion.id}`,
          editingQuestion,
        )
        saved = res.question
        const updated = questions.map((q) => (q.id === saved.id ? saved : q))
        setQuestions(updated)
        onQuestionsChange(updated)
      } else {
        const res = await apiPost<{ question: Question }>('/api/admin/questions', editingQuestion)
        saved = res.question
        const updated = [...questions, saved]
        setQuestions(updated)
        onQuestionsChange(updated)
      }

      setEditingQuestion(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full space-y-6 select-none">
      {/* Header action */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black text-ink">Quiz Questions ({questions.length})</h2>
        <button
          type="button"
          onClick={handleCreateNew}
          className="px-4 py-2.5 rounded-2xl bg-[#7b1fa2] text-white font-black text-xs sm:text-sm border-2 border-ink shadow-[3px_3px_0px_#2a2440] hover:-translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Question</span>
        </button>
      </div>

      {/* Questions list with drag & drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {questions.map((q) => (
              <SortableQuestionRow
                key={q.id}
                question={q}
                onEdit={(q) => setEditingQuestion(q)}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Question Edit / Create Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-2xl notebook-card bg-[#fffdf7] p-6 sm:p-8 space-y-6 border-3 border-ink shadow-[8px_8px_0px_#2a2440] relative my-6 animate-pop">
            <button
              type="button"
              onClick={() => setEditingQuestion(null)}
              className="absolute top-4 right-4 p-2 rounded-xl sticky-note-rose border-2 border-ink text-ink font-bold hover:-translate-y-0.5 transition-all cursor-pointer shadow-[2px_2px_0px_#2a2440]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5 text-left">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full sticky-note-yellow text-ink font-black text-xs uppercase tracking-wider -rotate-1">
                <PaperClip className="w-4 h-4 text-ink" />
                <span>Question Editor</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-ink">
                {editingQuestion.id ? 'Edit Question' : 'Add New Question'}
              </h3>
            </div>

            <div className="space-y-5 text-left">
              {/* Type Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-ink tracking-wider">
                  Question Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['MCQ', 'TRUE_FALSE', 'IMAGE'] as QuestionType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        const opts =
                          t === 'TRUE_FALSE'
                            ? ['True', 'False']
                            : editingQuestion.options?.length === 4
                            ? editingQuestion.options
                            : ['', '', '', '']
                        setEditingQuestion((prev) => ({ ...prev, type: t, options: opts, correctIndex: 0 }))
                      }}
                      className={`py-2.5 px-3 rounded-xl border-2 border-ink text-xs font-black transition-all cursor-pointer shadow-[2px_2px_0px_#2a2440] ${
                        editingQuestion.type === t
                          ? 'sticky-note-lavender text-ink'
                          : 'bg-paper-cream text-ink hover:bg-note-yellow/40'
                      }`}
                    >
                      {t === 'MCQ' ? 'Multiple Choice' : t === 'TRUE_FALSE' ? 'True / False' : 'Image Question'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-ink tracking-wider">
                  Question Prompt
                </label>
                <input
                  type="text"
                  value={editingQuestion.prompt || ''}
                  onChange={(e) =>
                    setEditingQuestion((prev) => ({ ...prev, prompt: e.target.value }))
                  }
                  placeholder="Enter the question prompt..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-ink bg-paper-cream text-ink text-sm font-extrabold shadow-[2px_2px_0px_#2a2440] focus:outline-hidden focus:ring-3 focus:ring-[#7b1fa2]"
                />
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                <label className="block text-xs font-black uppercase text-ink tracking-wider">
                  Answer Options & Correct Choice (Tap check to select correct answer)
                </label>

                {(editingQuestion.options || ['', '', '', '']).map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion((prev) => ({ ...prev, correctIndex: idx }))}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border-2 border-ink transition-all cursor-pointer shadow-[2px_2px_0px_#2a2440] ${
                        editingQuestion.correctIndex === idx
                          ? 'bg-[#388e3c] text-white'
                          : 'bg-paper-cream text-ink-soft hover:text-ink'
                      }`}
                    >
                      {editingQuestion.correctIndex === idx && <Check className="w-5 h-5 stroke-[3]" />}
                    </button>

                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...(editingQuestion.options || [])]
                        newOpts[idx] = e.target.value
                        setEditingQuestion((prev) => ({ ...prev, options: newOpts }))
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink bg-paper-cream text-ink text-sm font-extrabold shadow-[2px_2px_0px_#2a2440] focus:outline-hidden"
                    />
                  </div>
                ))}
              </div>

              {/* Timer Duration */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-ink tracking-wider">
                  Question Timer Duration
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIMER_CHOICES.map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setEditingQuestion((prev) => ({ ...prev, timerSeconds: sec }))}
                      className={`py-1.5 px-3 rounded-xl border-2 border-ink text-xs font-black transition-all cursor-pointer shadow-[1.5px_1.5px_0px_#2a2440] ${
                        (editingQuestion.timerSeconds || 5) === sec
                          ? 'bg-[#7b1fa2] text-white'
                          : 'bg-paper-cream text-ink hover:bg-note-yellow/40'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Upload - Only for IMAGE question type */}
              {editingQuestion.type === 'IMAGE' && (
                <div className="space-y-2.5 p-3.5 rounded-xl border-2 border-ink sticky-note-yellow">
                  <label className="block text-xs font-black uppercase text-ink tracking-wider">
                    Question Image (Required for Image Question)
                  </label>

                  {editingQuestion.imageId ? (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="w-32 h-24 relative rounded-lg border-2 border-ink overflow-hidden bg-white shrink-0 shadow-[2px_2px_0px_#2a2440]">
                        {/* eslint-disable-next-html-element-suppression */}
                        <img
                          src={`/api/image/${editingQuestion.imageId}`}
                          alt="Uploaded question illustration"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="px-3.5 py-1.5 rounded-xl border-2 border-ink bg-paper-cream text-ink text-xs font-black flex items-center gap-1.5 hover:bg-paper-light cursor-pointer shadow-[1.5px_1.5px_0px_#2a2440]">
                          <ImageIcon className="w-4 h-4" />
                          <span>{uploadingImage ? 'Uploading...' : 'Replace Image'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setEditingQuestion((prev) => (prev ? { ...prev, imageId: null } : null))}
                          className="px-3.5 py-1.5 rounded-xl border-2 border-ink sticky-note-rose text-ink text-xs font-black hover:bg-rose-tint cursor-pointer shadow-[1.5px_1.5px_0px_#2a2440]"
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <label className="px-4 py-2.5 rounded-xl border-2 border-ink sticky-note-lavender text-ink text-xs font-black flex items-center gap-2 hover:-translate-y-0.5 transition-all cursor-pointer shadow-[2px_2px_0px_#2a2440]">
                        <ImageIcon className="w-4 h-4" />
                        <span>{uploadingImage ? 'Uploading Image...' : 'Choose Question Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-ink tracking-wider">
                  Educational Fun Fact / Explanation (Optional)
                </label>
                <textarea
                  value={editingQuestion.explanation || ''}
                  onChange={(e) =>
                    setEditingQuestion((prev) => ({ ...prev, explanation: e.target.value }))
                  }
                  rows={2}
                  placeholder="Shown during the reveal phase to teach participants fun facts..."
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-ink bg-paper-cream text-ink text-xs font-extrabold shadow-[2px_2px_0px_#2a2440] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-ink">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-5 py-2.5 rounded-xl sticky-note-rose border-2 border-ink text-ink text-xs font-black shadow-[2px_2px_0px_#2a2440] hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-[#7b1fa2] text-white text-xs font-black border-2 border-ink shadow-[4px_4px_0px_#2a2440] hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
