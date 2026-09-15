import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Topbar({breadcrumb}: {breadcrumb:string}) {
  const {user} = useAuth()
  const initials = user?.email?.slice(0,2).toUpperCase() ?? '??'

  return(
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <p className="text-sm font-medium text-slate-500">
        SIGRE <span className="mx-1 text-slate-300"></span> {breadcrumb}
      </p>

      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 hover:bg-slate-100">
          <Bell className="h-5 w-5 text-slate-500"></Bell>
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-700">
          Administrador
        </span>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
          {initials}
        </div>
      </div>
    </header>
  )
}