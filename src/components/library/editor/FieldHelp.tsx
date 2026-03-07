/**
 * @agent     FieldHelp
 * @persona   Componente de ajuda contextual para campos do editor
 * @commands  render
 * @context   Exibe icone de info ao lado do label. Popover com descricao, relacionamentos e exemplos.
 */

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HelpCircle, Link2, FileText } from 'lucide-react';
import type { FieldHelpData } from '@/data/editor-field-help';

interface FieldHelpProps {
  data?: FieldHelpData;
  className?: string;
}

export default function FieldHelp({ data, className }: FieldHelpProps) {
  if (!data) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors ${className ?? ''}`}
          aria-label="Ajuda do campo"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-80 p-0 text-xs"
        sideOffset={8}
      >
        <div className="p-3 space-y-3">
          {/* Description */}
          <p className="text-foreground leading-relaxed">{data.description}</p>

          {/* Relationships */}
          {data.relationships && data.relationships.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <Link2 className="w-3 h-3" />
                <span>Relacionamentos</span>
              </div>
              <ul className="space-y-0.5 ml-1">
                {data.relationships.map((rel, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-muted-foreground">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{rel}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Example */}
          {data.example && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <FileText className="w-3 h-3" />
                <span>Exemplos</span>
              </div>
              <pre className="whitespace-pre-wrap text-[11px] font-mono bg-secondary/60 rounded-md px-2.5 py-2 text-foreground/80 leading-relaxed">
                {data.example}
              </pre>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Renders a Label with FieldHelp inline */
export function LabelWithHelp({
  children,
  help,
  className,
}: {
  children: React.ReactNode;
  help?: FieldHelpData;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 ${className ?? ''}`}>
      <span className="text-xs font-medium">{children}</span>
      <FieldHelp data={help} />
    </div>
  );
}
