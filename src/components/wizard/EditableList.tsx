/**
 * @agent     EditableList
 * @persona   Componente reutilizavel de lista editavel com add/remove
 * @commands  onAdd, onRemove
 * @context   Usado no AgentCatalog e AgentEditor para listas de tools, skills, commands, deps
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

interface EditableListProps {
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  icon: React.FC<any>;
}

export function EditableList({ items, onAdd, onRemove, placeholder, icon: Icon }: EditableListProps) {
  const [input, setInput] = useState('');
  const handleAdd = () => {
    if (!input.trim()) return;
    onAdd(input.trim());
    setInput('');
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={placeholder}
          className="h-8 text-xs"
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
        />
        <Button variant="outline" size="sm" className="h-8 shrink-0 gap-1 text-xs" onClick={handleAdd} disabled={!input.trim()}>
          <Plus className="w-3 h-3" /> Adicionar
        </Button>
      </div>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <Badge key={`${item}-${i}`} variant="secondary" className="gap-1 text-xs font-mono pr-1">
              <Icon className="w-3 h-3 opacity-60" />
              {item}
              <button onClick={() => onRemove(i)} className="ml-0.5 hover:text-destructive transition-colors">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Nenhum item adicionado</p>
      )}
    </div>
  );
}
