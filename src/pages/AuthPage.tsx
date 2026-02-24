import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Cpu, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success('Conta criada! Verifique seu email para confirmar.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="bg-dots absolute inset-0 pointer-events-none opacity-20" />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(190 95% 50% / 0.06) 0%, transparent 70%)',
          top: '-15%', left: '30%',
        }}
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 10, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(265 80% 60% / 0.05) 0%, transparent 70%)',
          bottom: '-10%', right: '20%',
        }}
        animate={{ x: [0, -30, 20, 0], y: [0, 20, -15, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-20 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong rounded-2xl p-8 w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[var(--shadow-glow)]">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight">AIOS Forge</span>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              isLogin ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              !isLogin ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Criar conta
          </button>
        </div>

        <p className="text-muted-foreground text-center text-xs mb-6">
          {isLogin ? 'Acesse seus projetos AIOS' : 'Comece a construir seu sistema de agentes'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="pl-10 h-11 rounded-xl bg-secondary/30 border-border/50 focus:border-primary/40"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 h-11 rounded-xl bg-secondary/30 border-border/50 focus:border-primary/40"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-xl font-semibold shadow-[var(--shadow-glow)]"
            disabled={loading}
          >
            {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground/60 mt-6">
          {isLogin ? 'Nao tem conta? ' : 'Ja tem conta? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline font-medium"
          >
            {isLogin ? 'Criar conta' : 'Entrar'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
