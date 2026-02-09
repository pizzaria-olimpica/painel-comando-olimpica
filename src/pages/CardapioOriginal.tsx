import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Pizza } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface Prato {
  id: number
  nome: string | null
  ingredientes: string | null
  valor_pizza_broto_4_fatias: number | null
  valor_pizza_media_6_fatias: number | null
  valor_pizza_grande_8_fatias: number | null
  valor_pizza_gigante_12_fatias: number | null
  valor_borda_recheada: number | null
  disponivel: boolean
}

const Cardapio = () => {
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingPrato, setEditingPrato] = useState<Prato | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Prato | null>(null)

  const [form, setForm] = useState({
    nome: "",
    ingredientes: "",
    broto: "",
    media: "",
    grande: "",
    gigante: "",
    borda: "",
  })

  const { data: pratos, isLoading } = useQuery({
    queryKey: ["cardapio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cardapio")
        .select("*")
        .order("nome")
      if (error) throw error
      return data as Prato[]
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome,
        ingredientes: form.ingredientes,
        valor_pizza_broto_4_fatias: Number(form.broto) || null,
        valor_pizza_media_6_fatias: Number(form.media) || null,
        valor_pizza_grande_8_fatias: Number(form.grande) || null,
        valor_pizza_gigante_12_fatias: Number(form.gigante) || null,
        valor_borda_recheada: Number(form.borda) || null,
      }

      if (editingPrato) {
        const { error } = await supabase
          .from("cardapio")
          .update(payload)
          .eq("id", editingPrato.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("cardapio").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardapio"] })
      toast.success(editingPrato ? "Pizza atualizada!" : "Pizza criada!")
      setDialogOpen(false)
      setEditingPrato(null)
      setForm({
        nome: "",
        ingredientes: "",
        broto: "",
        media: "",
        grande: "",
        gigante: "",
        borda: "",
      })
    },
    onError: () => toast.error("Erro ao salvar pizza"),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteTarget) return
      const { error } = await supabase
        .from("cardapio")
        .delete()
        .eq("id", deleteTarget.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardapio"] })
      toast.success("Pizza removida")
      setDeleteOpen(false)
      setDeleteTarget(null)
    },
  })

  const openEdit = (p: Prato) => {
    setEditingPrato(p)
    setForm({
      nome: p.nome || "",
      ingredientes: p.ingredientes || "",
      broto: p.valor_pizza_broto_4_fatias?.toString() || "",
      media: p.valor_pizza_media_6_fatias?.toString() || "",
      grande: p.valor_pizza_grande_8_fatias?.toString() || "",
      gigante: p.valor_pizza_gigante_12_fatias?.toString() || "",
      borda: p.valor_borda_recheada?.toString() || "",
    })
    setDialogOpen(true)
  }

  if (isLoading) {
    return <div className="h-40 flex items-center justify-center">Carregando…</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Cardápio de Pizzas</CardTitle>
            <CardDescription>{pratos?.length} sabores</CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Pizza
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {pratos?.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between border rounded p-4"
            >
              <div>
                <h4 className="font-semibold">{p.nome}</h4>
                <p className="text-sm text-muted-foreground">
                  {p.ingredientes}
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {p.valor_pizza_broto_4_fatias && (
                    <Badge>Broto R$ {p.valor_pizza_broto_4_fatias}</Badge>
                  )}
                  {p.valor_pizza_media_6_fatias && (
                    <Badge>Média R$ {p.valor_pizza_media_6_fatias}</Badge>
                  )}
                  {p.valor_pizza_grande_8_fatias && (
                    <Badge>Grande R$ {p.valor_pizza_grande_8_fatias}</Badge>
                  )}
                  {p.valor_pizza_gigante_12_fatias && (
                    <Badge>Gigante R$ {p.valor_pizza_gigante_12_fatias}</Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    setDeleteTarget(p)
                    setDeleteOpen(true)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPrato ? "Editar Pizza" : "Nova Pizza"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="Nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
            <Textarea
              placeholder="Ingredientes"
              value={form.ingredientes}
              onChange={(e) =>
                setForm({ ...form, ingredientes: e.target.value })
              }
            />
            <Input placeholder="Broto" value={form.broto} onChange={(e)=>setForm({...form, broto:e.target.value})}/>
            <Input placeholder="Média" value={form.media} onChange={(e)=>setForm({...form, media:e.target.value})}/>
            <Input placeholder="Grande" value={form.grande} onChange={(e)=>setForm({...form, grande:e.target.value})}/>
            <Input placeholder="Gigante" value={form.gigante} onChange={(e)=>setForm({...form, gigante:e.target.value})}/>
            <Input placeholder="Borda recheada" value={form.borda} onChange={(e)=>setForm({...form, borda:e.target.value})}/>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => saveMutation.mutate()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pizza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Cardapio
