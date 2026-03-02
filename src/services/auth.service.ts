/**
 * @agent     AuthService
 * @persona   Camada de servico para autenticacao e gestao de sessao
 * @version   1.0.0
 * @commands  signIn, signUp, signOut, getSession, getUser
 * @deps      supabase/client
 * @context   Usado por AuthPage, DashboardPage e WizardPage para operacoes de auth
 */

import { supabase } from '@/integrations/supabase/client';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, redirectTo?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo || window.location.origin },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}
