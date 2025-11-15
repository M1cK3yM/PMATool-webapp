"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { FileText, Play, Users, Settings, Sigma, Save, TableConfig, TableConfigIcon } from "lucide-react"
import MasterMRP from "./sections/MasterMRP"
import ViewPlanDialog from "./components/ViewPlan-dialog"
import ConfigureDialog from "./components/Configure-dialog"
import { getConfig } from "@/lib/config-service"

export default function CostAnalyzer() {
  const [viewPlanOpen, setViewPlanOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const [dbHost, setDbHost] = useState("")
  const [dbPort, setDbPort] = useState("")
  const [dbName, setDbName] = useState("")
  const [dbUser, setDbUser] = useState("")
  const [dbPass, setDbPass] = useState("")
  const [dbType, setDbType] = useState("")

  const [planConn, setPlanConn] = useState("")

  const parseConnection = (value: string) => {
    const delimiter = value.includes(";") ? ";" : ","
    const entries = value
      .split(delimiter)
      .map(s => s.trim())
      .filter(Boolean)
      .map(part => {
        const eqIdx = part.indexOf("=")
        if (eqIdx === -1) return [part.toLowerCase(), ""] as [string, string]
        const key = part.slice(0, eqIdx).trim().toLowerCase()
        const val = part.slice(eqIdx + 1).trim()
        return [key, val] as [string, string]
      })
    const map = new Map<string, string>(entries)
    const host = map.get("server") || map.get("host") || ""
    const db = map.get("database") || map.get("dbname") || ""
    const user = map.get("user id") || map.get("uid") || map.get("user") || ""
    const pass = map.get("password") || map.get("pwd") || ""
    const port = map.get("port") || ""
    const dbType = map.get("type") || ""
    return { host, db, user, pass, port, dbType }
  }
  const openConfigDialog = () => {
    if (planConn && planConn.trim().length > 0) {
      const parsed = parseConnection(planConn)
      setDbHost(parsed.host)
      setDbName(parsed.db)
      setDbUser(parsed.user)
      setDbPass(parsed.pass)
      setDbPort(parsed.port)
      setDbType(parsed.dbType)
    } else {
      setDbHost("")
      setDbName("")
      setDbUser("")
      setDbPass("")
      setDbPort("")
      setDbType("")
    }
    setConfigOpen(true)
  }

  useEffect(() => {
    const username = 'Administrator'
    getConfig(username)
      .then(cfg => {
        setPlanConn(cfg.plan_dsn)
      })
      .catch(() => {
        // no config yet or error — stay with defaults
      })
  }, [])
  return (
    <div className="flex flex-col h-[84vh] overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex items-center gap-2 border-b bg-background">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setViewPlanOpen(true)}>
          <FileText className="h-4 w-4" /> View Plan
        </Button>
        <Button variant="default" size="sm" className="gap-2">
          <Play className="h-4 w-4" /> Execute
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" /> Labor
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" /> Machine
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Sigma className="h-4 w-4" /> Misc
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={openConfigDialog}>
          <TableConfigIcon className="h-4 w-4" /> Configure
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Save className="h-4 w-4" /> Export
        </Button>
      </div>

      <ViewPlanDialog open={viewPlanOpen} onOpenChange={setViewPlanOpen} />
      <ConfigureDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        setPlanConn={setPlanConn}
        dbConnection={{
          dbHost,
          dbPort,
          dbName,
          dbUser,
          dbPass,
          dbType
        }} />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Main Table */}
          <ResizablePanel defaultSize={65} minSize={40}>
            <ResizablePanelGroup direction="vertical" className="w-50">
              <ResizablePanel defaultSize={65} minSize={40}>
                <MasterMRP />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={35} minSize={20} className="border-t">
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Right Panel - Stacked Sections */}
          <ResizablePanel defaultSize={35} minSize={30}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* Nom Material Usage Section */}
              <ResizablePanel defaultSize={40} minSize={25}>
                <Card className="h-full flex flex-col rounded-none m-0 py-0">
                  <CardContent className="flex-1 overflow-auto p-2">
                    <Tabs defaultValue="nom-material" className="w-full h-full">
                      <TabsList className="grid w-full grid-cols-4 gap-1">
                        <TabsTrigger value="nom-material" className="text-xs truncate">Material Usage</TabsTrigger>
                        <TabsTrigger value="machine" className="text-xs truncate">Machine</TabsTrigger>
                        <TabsTrigger value="labor" className="text-xs truncate">Labor Usage</TabsTrigger>
                        <TabsTrigger value="misc" className="text-xs truncate">Miscellaneous</TabsTrigger>
                      </TabsList>
                      <TabsContent value="nom-material" className="mt-2">
                        <div className="text-xs text-muted-foreground mb-2">
                          (Source): Material Inputs: This part uses the following products as Material Input
                        </div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[80px]">Stage</TableHead>
                                <TableHead className="w-[100px]">Part Code</TableHead>
                                <TableHead className="w-[80px]">WH</TableHead>
                                <TableHead className="w-[120px]">Part Desc</TableHead>
                                <TableHead className="w-[80px]">Recipe</TableHead>
                                <TableHead className="w-[90px]">Setup Qty</TableHead>
                                <TableHead className="w-[90px]">Input Qty</TableHead>
                                <TableHead className="w-[100px]">In Qty/Batch</TableHead>
                                <TableHead className="w-[70px]">UOM</TableHead>
                                <TableHead className="w-[90px]">Nom. In Qty.</TableHead>
                                <TableHead className="w-[80px]">Nom U...</TableHead>
                                <TableHead className="w-[90px]">Std Cost</TableHead>
                                <TableHead className="w-[80px]">Batches</TableHead>
                                <TableHead className="w-[100px]">Req Qty (Nom)</TableHead>
                                <TableHead className="w-[90px]">User Qty</TableHead>
                                <TableHead className="w-[80px]">Column</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody className="h-full">
                              <TableRow>
                                <TableCell colSpan={16} className="text-center text-muted-foreground py-4">
                                  No data available
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                      <TabsContent value="machine" className="mt-2">
                        <div className="text-xs text-muted-foreground mb-2">Machine usage information</div>
                      </TabsContent>
                      <TabsContent value="labor" className="mt-2">
                        <div className="text-xs text-muted-foreground mb-2">Labor usage information</div>
                      </TabsContent>
                      <TabsContent value="misc" className="mt-2">
                        <div className="text-xs text-muted-foreground mb-2">Miscellaneous information</div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Part Usage Section */}
              <ResizablePanel defaultSize={30} minSize={20}>
                <Card className="h-full flex flex-col rounded-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Part Usage</CardTitle>
                    <div className="text-xs text-muted-foreground mt-1">
                      (Destination): Part Usage: This part is used to manufacture the following products.
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto p-2">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Part Code</TableHead>
                            <TableHead className="w-[80px]">WH</TableHead>
                            <TableHead className="w-[120px]">Part Desc</TableHead>
                            <TableHead className="w-[80px]">Stage</TableHead>
                            <TableHead className="w-[80px]">Recipe</TableHead>
                            <TableHead className="w-[90px]">Setup Qty</TableHead>
                            <TableHead className="w-[90px]">Input Qty</TableHead>
                            <TableHead className="w-[100px]">Total Q...</TableHead>
                            <TableHead className="w-[70px]">UOM</TableHead>
                            <TableHead className="w-[90px]">Nom. T...</TableHead>
                            <TableHead className="w-[80px]">Nom U...</TableHead>
                            <TableHead className="w-[80px]">Batches</TableHead>
                            <TableHead className="w-[100px]">Total N...</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell colSpan={13} className="text-center text-muted-foreground py-4">
                              No data available
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Multi-level Bill of Materials Section */}
              <ResizablePanel defaultSize={30} minSize={20}>
                <Card className="h-full flex flex-col rounded-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Multi-level Bill of Materials</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto p-2">
                    <div className="flex gap-2 mb-2">
                      <Input placeholder="Part code" className="flex-1" />
                      <Button size="sm">Show Part</Button>
                    </div>
                    <div className="border rounded-md p-4 h-full min-h-[200px] bg-muted/20">
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Multi-level BOM structure will be displayed here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </ResizablePanel>

            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Status Bar */}
      <div className="border-t bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground">
        Status: Process Manufacturing Advanced Analyzer, Version 1.00
      </div>
    </div>
  )
}

