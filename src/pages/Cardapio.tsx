import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Pizza, Coffee, UtensilsCrossed, Plus, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PizzaItem {
  id: number;
  nome: string | null;
  ingredientes: string | null;
  valor_pizza_broto_4_fatias: number | null;
  valor_pizza_media_6_fatias: number | null;
  valor_pizza_grande_8_fatias: number | null;
  valor_pizza_gigante_12_fatias: number | null;
  valor_borda_recheada: number | null;
  disponivel: boolean;
}

interface Bebida {
  id: number;
  nome: string | null;
  tipo: string | null;
  tamanho: string | null;
  valor: number | null;
  disponivel: boolean;
}

interface Borda {
  id: number;
  tamanho_pizza: string | null;
  valor_borda_recheada: number | null;
}

const CardapioPizzaria = () => {
  const queryClient = useQueryClient();
  
  // Dialog states
  const [pizzaDialogOpen, setPizzaDialogOpen] = useState(false);
  const [bebidaDialogOpen, setBebidaDialogOpen] = useState(false);
  const [bordaDialogOpen, setBordaDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Edit states
  const [editingPizza, setEditingPizza] = useState<PizzaItem | null>(null);
  const [editingBebida, setEditingBebida] = useState<Bebida | null>(null);
  const [editingBorda, setEditingBorda] = useState<Borda | null>(null);
  
  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'pizza' | 'bebida' | 'borda'; id: number; name: string } | null>(null);
  
  // Form states
  const [pizzaForm, setPizzaForm] = useState({
    nome: "",
    ingredientes: "",
    broto: "",
    media: "",
    grande: "",
    gigante: "",
  });
  const [bebidaForm, setBebidaForm] = useState({ nome: "", tipo: "", tamanho: "", valor: "" });
  const [bordaForm, setBordaForm] = useState({ tamanho_pizza: "", valor_borda_recheada: "" });

  // --- QUERIES ---

  const { data: pizzas, isLoading: loadingPizzas } = useQuery({
    queryKey: ["cardapio_pizzas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cardapio") 
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as PizzaItem[];
    },
  });

  const { data: bebidas, isLoading: loadingBebidas } = useQuery({
    queryKey: ["bebidas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bebidas")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as Bebida[];
    },
  });

  const { data: bordas } = useQuery({
    queryKey: ["borda_recheada"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("borda_recheada")
        .select("*");
      if (error) throw error;
      return data as Borda[];
    },
  });

  // --- MUTATIONS ---

  const savePizzaMutation = useMutation({
    mutationFn: async (pizza: typeof pizzaForm & { id?: number }) => {
      const payload = {
        nome: pizza.nome,
        ingredientes: pizza.ingredientes,
        valor_pizza_broto_4_fatias: parseFloat(pizza.broto.replace(",", ".")) || null,
        valor_pizza_media_6_fatias: parseFloat(pizza.media.replace(",", ".")) || null,
        valor_pizza_grande_8_fatias: parseFloat(pizza.grande.replace(",", ".")) || null,
        valor_pizza_gigante_12_fatias: parseFloat(pizza.gigante.replace(",", ".")) || null,
      };

      if (pizza.id) {
        const { error } = await supabase.from("cardapio").update(payload).eq("id", pizza.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cardapio").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardapio_pizzas"] });
      toast.success(editingPizza ? "Pizza atualizada!" : "Pizza adicionada!");
      setPizzaDialogOpen(false);
      setEditingPizza(null);
      setPizzaForm({ nome: "", ingredientes: "", broto: "", media: "", grande: "", gigante: "" });
    },
    onError: () => toast.error("Erro ao salvar pizza"),
  });

  const togglePizzaDisponibilidadeMutation = useMutation({
    mutationFn: async ({ id, disponivel }: { id: number; disponivel: boolean }) => {
      const { error } = await supabase.from("cardapio").update({ disponivel }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardapio_pizzas"] });
    },
    onError: () => toast.error("Erro ao atualizar disponibilidade"),
  });

  const saveBebidaMutation = useMutation({
    mutationFn: async (bebida: { id?: number; nome: string; tipo: string; tamanho: string; valor: number }) => {
      if (bebida.id) {
        const { error } = await supabase.from("bebidas").update({
          nome: bebida.nome,
          tipo: bebida.tipo,
          tamanho: bebida.tamanho,
          valor: bebida.valor,
        }).eq("id", bebida.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bebidas").insert({
          nome: bebida.nome,
          tipo: bebida.tipo,
          tamanho: bebida.tamanho,
          valor: bebida.valor,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bebidas"] });
      toast.success(editingBebida ? "Bebida atualizada!" : "Bebida adicionada!");
      setBebidaDialogOpen(false);
      setEditingBebida(null);
      setBebidaForm({ nome: "", tipo: "", tamanho: "", valor: "" });
    },
    onError: () => toast.error("Erro ao salvar bebida"),
  });

  const toggleBebidaDisponibilidadeMutation = useMutation({
    mutationFn: async ({ id, disponivel }: { id: number; disponivel: boolean }) => {
      const { error } = await supabase.from("bebidas").update({ disponivel }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bebidas"] });
    },
    onError: () => toast.error("Erro ao atualizar disponibilidade"),
  });

  const saveBordaMutation = useMutation({
    mutationFn: async (borda: { id?: number; tamanho_pizza: string; valor_borda_recheada: number }) => {
      if (borda.id) {
        const { error } = await supabase.from("borda_recheada").update({
          tamanho_pizza: borda.tamanho_pizza,
          valor_borda_recheada: borda.valor_borda_recheada,
        }).eq("id", borda.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("borda_recheada").insert({
          tamanho_pizza: borda.tamanho_pizza,
          valor_borda_recheada: borda.valor_borda_recheada,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borda_recheada"] });
      toast.success(editingBorda ? "Borda atualizada!" : "Borda adicionada!");
      setBordaDialogOpen(false);
      setEditingBorda(null);
      setBordaForm({ tamanho_pizza: "", valor_borda_recheada: "" });
    },
    onError: () => toast.error("Erro ao salvar borda"),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: 'pizza' | 'bebida' | 'borda'; id: number }) => {
      const table = type === 'pizza' ? 'cardapio' : type === 'bebida' ? 'bebidas' : 'borda_recheada';
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardapio_pizzas"] });
      queryClient.invalidateQueries({ queryKey: ["bebidas"] });
      queryClient.invalidateQueries({ queryKey: ["borda_recheada"] });
      toast.success("Item excluído!");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: () => toast.error("Erro ao excluir item"),
  });

  const isLoading = loadingPizzas || loadingBebidas;

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return `R$ ${price.toFixed(2).replace(".", ",")}`;
  };

  // --- HANDLERS ---

  const openEditPizza = (pizza: PizzaItem) => {
    setEditingPizza(pizza);
    setPizzaForm({
      nome: pizza.nome || "",
      ingredientes: pizza.ingredientes || "",
      broto: pizza.valor_pizza_broto_4_fatias?.toString() || "",
      media: pizza.valor_pizza_media_6_fatias?.toString() || "",
      grande: pizza.valor_pizza_grande_8_fatias?.toString() || "",
      gigante: pizza.valor_pizza_gigante_12_fatias?.toString() || "",
    });
    setPizzaDialogOpen(true);
  };

  const openEditBebida = (bebida: Bebida) => {
    setEditingBebida(bebida);
    setBebidaForm({
      nome: bebida.nome || "",
      tipo: bebida.tipo || "",
      tamanho: bebida.tamanho || "",
      valor: bebida.valor?.toString() || "",
    });
    setBebidaDialogOpen(true);
  };

  const openEditBorda = (borda: Borda) => {
    setEditingBorda(borda);
    setBordaForm({
      tamanho_pizza: borda.tamanho_pizza || "",
      valor_borda_recheada: borda.valor_borda_recheada?.toString() || "",
    });
    setBordaDialogOpen(true);
  };

  const openNewPizza = () => {
    setEditingPizza(null);
    setPizzaForm({ nome: "", ingredientes: "", broto: "", media: "", grande: "", gigante: "" });
    setPizzaDialogOpen(true);
  };

  const openNewBebida = () => {
    setEditingBebida(null);
    setBebidaForm({ nome: "", tipo: "", tamanho: "", valor: "" });
    setBebidaDialogOpen(true);
  };

  const openNewBorda = () => {
    setEditingBorda(null);
    setBordaForm({ tamanho_pizza: "", valor_borda_recheada: "" });
    setBordaDialogOpen(true);
  };

  const confirmDelete = (type: 'pizza' | 'bebida' | 'borda', id: number, name: string) => {
    setDeleteTarget({ type, id, name });
    setDeleteDialogOpen(true);
  };

  const handleSavePizza = () => {
    savePizzaMutation.mutate({
      id: editingPizza?.id,
      ...pizzaForm
    });
  };

  const handleSaveBebida = () => {
    saveBebidaMutation.mutate({
      id: editingBebida?.id,
      nome: bebidaForm.nome,
      tipo: bebidaForm.tipo,
      tamanho: bebidaForm.tamanho,
      valor: parseFloat(bebidaForm.valor.replace(",", ".")) || 0,
    });
  };

  const handleSaveBorda = () => {
    saveBordaMutation.mutate({
      id: editingBorda?.id,
      tamanho_pizza: bordaForm.tamanho_pizza,
      valor_borda_recheada: parseFloat(bordaForm.valor_borda_recheada.replace(",", ".")) || 0,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">
            <span className="neon-text-cyan">Cardápio da Pizzaria</span>
          </h2>
          <p className="text-muted-foreground">
            Gerencie suas pizzas, bebidas e bordas
          </p>
        </div>
      </div>

      <Tabs defaultValue="pizzas" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="pizzas" className="data-[state=active]:bg-primary/20">
            <Pizza className="h-4 w-4 mr-2" />
            Pizzas
          </TabsTrigger>
          <TabsTrigger value="bebidas" className="data-[state=active]:bg-secondary/20">
            <Coffee className="h-4 w-4 mr-2" />
            Bebidas
          </TabsTrigger>
          <TabsTrigger value="bordas" className="data-[state=active]:bg-accent/20">
            <UtensilsCrossed className="h-4 w-4 mr-2" />
            Bordas
          </TabsTrigger>
        </TabsList>

        {/* TABA DE PIZZAS */}
        <TabsContent value="pizzas" className="mt-6">
          <Card className="glass-card neon-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sabores de Pizza</CardTitle>
                <CardDescription>{pizzas?.length || 0} sabores cadastrados</CardDescription>
              </div>
              <Button onClick={openNewPizza} className="neon-glow-cyan">
                <Plus className="h-4 w-4 mr-2" />
                Nova Pizza
              </Button>
            </CardHeader>
            <CardContent>
              {pizzas && pizzas.length > 0 ? (
                <div className="grid gap-4">
                  {pizzas.map((item) => (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/50 transition-colors ${!item.disponivel ? 'opacity-50' : ''}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-lg">{item.nome}</h4>
                          {!item.disponivel && (
                            <Badge variant="secondary" className="text-xs">Indisponível</Badge>
                          )}
                        </div>
                        {item.ingredientes && (
                          <p className="text-sm text-muted-foreground mt-1 mb-2">{item.ingredientes}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {item.valor_pizza_broto_4_fatias && (
                             <Badge variant="outline" className="border-cyan-500/50">Broto: {formatPrice(item.valor_pizza_broto_4_fatias)}</Badge>
                          )}
                          {item.valor_pizza_media_6_fatias && (
                             <Badge variant="outline" className="border-cyan-500/50">Média: {formatPrice(item.valor_pizza_media_6_fatias)}</Badge>
                          )}
                          {item.valor_pizza_grande_8_fatias && (
                             <Badge variant="outline" className="border-cyan-500/50">Grande: {formatPrice(item.valor_pizza_grande_8_fatias)}</Badge>
                          )}
                          {item.valor_pizza_gigante_12_fatias && (
                             <Badge variant="outline" className="border-cyan-500/50">Gigante: {formatPrice(item.valor_pizza_gigante_12_fatias)}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.disponivel}
                            onCheckedChange={(checked) => 
                              togglePizzaDisponibilidadeMutation.mutate({ id: item.id, disponivel: checked })
                            }
                          />
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {item.disponivel ? 'Disponível' : 'Indisponível'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditPizza(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => confirmDelete('pizza', item.id, item.nome || 'Item')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Pizza className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma pizza cadastrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TABA DE BEBIDAS */}
        <TabsContent value="bebidas" className="mt-6">
          <Card className="glass-card neon-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bebidas</CardTitle>
                <CardDescription>{bebidas?.length || 0} bebidas cadastradas</CardDescription>
              </div>
              <Button onClick={openNewBebida} className="neon-glow-magenta">
                <Plus className="h-4 w-4 mr-2" />
                Nova Bebida
              </Button>
            </CardHeader>
            <CardContent>
              {bebidas && bebidas.length > 0 ? (
                <div className="grid gap-4">
                  {bebidas.map((bebida) => (
                    <div 
                      key={bebida.id} 
                      className={`flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-secondary/50 transition-colors ${!bebida.disponivel ? 'opacity-50' : ''}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{bebida.nome}</h4>
                          {!bebida.disponivel && (
                            <Badge variant="secondary" className="text-xs">Indisponível</Badge>
                          )}
                        </div>
                        <div className="flex gap-2 mt-1">
                          {bebida.tipo && <Badge variant="secondary">{bebida.tipo}</Badge>}
                          {bebida.tamanho && <Badge variant="outline">{bebida.tamanho}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={bebida.disponivel}
                            onCheckedChange={(checked) => 
                              toggleBebidaDisponibilidadeMutation.mutate({ id: bebida.id, disponivel: checked })
                            }
                          />
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {bebida.disponivel ? 'Disponível' : 'Indisponível'}
                          </span>
                        </div>
                        <Badge variant="outline" className="neon-text-magenta">
                          {formatPrice(bebida.valor)}
                        </Badge>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditBebida(bebida)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => confirmDelete('bebida', bebida.id, bebida.nome || 'Item')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Coffee className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma bebida cadastrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TABA DE BORDAS */}
        <TabsContent value="bordas" className="mt-6">
          <Card className="glass-card neon-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bordas Recheadas</CardTitle>
                <CardDescription>Preços por tamanho</CardDescription>
              </div>
              <Button onClick={openNewBorda} className="neon-glow-green">
                <Plus className="h-4 w-4 mr-2" />
                Nova Borda
              </Button>
            </CardHeader>
            <CardContent>
              {bordas && bordas.length > 0 ? (
                <div className="grid gap-4">
                  {bordas.map((borda) => (
                    <div 
                      key={borda.id} 
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">Pizza {borda.tamanho_pizza}</h4>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="neon-text-green">
                          {formatPrice(borda.valor_borda_recheada)}
                        </Badge>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditBorda(borda)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => confirmDelete('borda', borda.id, borda.tamanho_pizza || 'Item')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma borda cadastrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for Pizza */}
      <Dialog open={pizzaDialogOpen} onOpenChange={setPizzaDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPizza ? "Editar Pizza" : "Nova Pizza"}</DialogTitle>
            <DialogDescription>
              {editingPizza ? "Atualize as informações da pizza" : "Adicione um novo sabor ao cardápio"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label>Nome do Sabor</Label>
              <Input 
                value={pizzaForm.nome}
                onChange={(e) => setPizzaForm({ ...pizzaForm, nome: e.target.value })}
                placeholder="Ex: Calabresa"
              />
            </div>
            <div className="space-y-2">
              <Label>Ingredientes</Label>
              <Textarea 
                value={pizzaForm.ingredientes}
                onChange={(e) => setPizzaForm({ ...pizzaForm, ingredientes: e.target.value })}
                placeholder="Ex: Molho, mussarela, calabresa e cebola"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label>Broto (4 fatias)</Label>
                <Input 
                  value={pizzaForm.broto}
                  onChange={(e) => setPizzaForm({ ...pizzaForm, broto: e.target.value })}
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Média (6 fatias)</Label>
                <Input 
                  value={pizzaForm.media}
                  onChange={(e) => setPizzaForm({ ...pizzaForm, media: e.target.value })}
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Grande (8 fatias)</Label>
                <Input 
                  value={pizzaForm.grande}
                  onChange={(e) => setPizzaForm({ ...pizzaForm, grande: e.target.value })}
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Gigante (12 fatias)</Label>
                <Input 
                  value={pizzaForm.gigante}
                  onChange={(e) => setPizzaForm({ ...pizzaForm, gigante: e.target.value })}
                  placeholder="R$ 0,00"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPizzaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePizza} disabled={savePizzaMutation.isPending}>
              {savePizzaMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Bebida */}
      <Dialog open={bebidaDialogOpen} onOpenChange={setBebidaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBebida ? "Editar Bebida" : "Nova Bebida"}</DialogTitle>
            <DialogDescription>
              {editingBebida ? "Atualize as informações da bebida" : "Adicione uma nova bebida ao cardápio"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Bebida</Label>
              <Input 
                value={bebidaForm.nome}
                onChange={(e) => setBebidaForm({ ...bebidaForm, nome: e.target.value })}
                placeholder="Ex: Coca-Cola"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Input 
                  value={bebidaForm.tipo}
                  onChange={(e) => setBebidaForm({ ...bebidaForm, tipo: e.target.value })}
                  placeholder="Ex: Refrigerante"
                />
              </div>
              <div className="space-y-2">
                <Label>Tamanho</Label>
                <Input 
                  value={bebidaForm.tamanho}
                  onChange={(e) => setBebidaForm({ ...bebidaForm, tamanho: e.target.value })}
                  placeholder="Ex: 2L"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input 
                value={bebidaForm.valor}
                onChange={(e) => setBebidaForm({ ...bebidaForm, valor: e.target.value })}
                placeholder="0,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBebidaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveBebida} disabled={saveBebidaMutation.isPending}>
              {saveBebidaMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Borda */}
      <Dialog open={bordaDialogOpen} onOpenChange={setBordaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBorda ? "Editar Borda" : "Nova Borda"}</DialogTitle>
            <DialogDescription>
              {editingBorda ? "Atualize as informações da borda" : "Adicione uma nova borda recheada"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tamanho da Pizza</Label>
              <Input 
                value={bordaForm.tamanho_pizza}
                onChange={(e) => setBordaForm({ ...bordaForm, tamanho_pizza: e.target.value })}
                placeholder="Ex: Grande"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor da Borda (R$)</Label>
              <Input 
                value={bordaForm.valor_borda_recheada}
                onChange={(e) => setBordaForm({ ...bordaForm, valor_borda_recheada: e.target.value })}
                placeholder="0,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBordaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveBorda} disabled={saveBordaMutation.isPending}>
              {saveBordaMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteTarget && deleteMutation.mutate({ type: deleteTarget.type, id: deleteTarget.id })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CardapioPizzaria;
