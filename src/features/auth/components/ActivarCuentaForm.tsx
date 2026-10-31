import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { activacionSchema, type ActivacionFormData } from '../schemas/activacionSchema'
import { useActivarCuenta } from '../hooks/useActivarCuenta'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function ActivarCuentaForm() {
  const { estado, motivo, tipo, correo, activar, guardando, error } = useActivarCuenta()

  const form = useForm<ActivacionFormData>({
    resolver: zodResolver(activacionSchema),
    defaultValues: { password: '', confirmacion: '' },
  })

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{tipo === 'recovery' ? 'Restablecer contraseña' : 'Activar cuenta'}</CardTitle>
      </CardHeader>
      <CardContent>
        {estado === 'verificando' && <p className="text-sm text-slate-500">Validando enlace...</p>}

        {estado === 'invalido' && (
          <div className="space-y-4">
            <p role="alert" className="text-sm text-red-600">{motivo}</p>
            <Link to="/login" className="text-sm font-semibold underline">Ir a iniciar sesión</Link>
          </div>
        )}

        {estado === 'listo' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(activar)} className="space-y-4">
              {correo && <p className="text-sm text-slate-600">Cuenta: <strong>{correo}</strong></p>}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar e ingresar'}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}
