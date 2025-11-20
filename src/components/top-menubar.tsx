"use client"

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { FolderOpen, Settings2, Database, SlidersHorizontal, BarChart3, CircleHelp } from "lucide-react"
import { useRouter } from "next/navigation"

export function TopMenubar() {
  const router = useRouter()
  return (
    <Menubar className="rounded-md border">
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <FolderOpen className="mr-2 h-4 w-4" /> Open
            <MenubarShortcut>Ctrl+O</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Exit</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Tools</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onSelect={() => router.push('/data-loader')}>
            <Database className="mr-2 h-4 w-4" /> Advanced Data Loader
          </MenubarItem>
          <MenubarItem onSelect={() => router.push('/tranfer-configuration')}> 
            <SlidersHorizontal className="mr-2 h-4 w-4" /> Transfer Configuration
          </MenubarItem>
          <MenubarItem onSelect={() => (window.location.href = '/')}>
            <BarChart3 className="mr-2 h-4 w-4" /> Advanced Cost Analyzer
          </MenubarItem>
          <MenubarItem onSelect={() => (window.location.href = '/')}>
            <CircleHelp className="mr-2 h-4 w-4" /> Facility Help
          </MenubarItem>
          {/* Records menu extracted to TransferConfiguration page */}
          <MenubarSeparator />
          <MenubarItem><Settings2 className="mr-2 h-4 w-4" /> Settings</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Tables</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <Database className="mr-2 h-4 w-4" /> Maintain
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}


