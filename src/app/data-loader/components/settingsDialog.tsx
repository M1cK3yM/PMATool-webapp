"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finDb: string; 
  manDb: string; 
  onSave: (finDb: string, manDb: string) => void;
}

type DbType = "postgres" | "sqlserver";

type DbConfig = {
  type: DbType;
  host: string;
  port: string;
  db: string;
  user: string;
  pass: string;
};

const ConfigForm = ({ 
  config, 
  setConfig, 
  onTest, // Added prop
  label 
}: { 
  config: DbConfig, 
  setConfig: (c: DbConfig) => void, 
  onTest: (c: DbConfig) => void, // Added type definition
  label: string 
}) => (
  <div className="space-y-4 py-2">
    {/* Database Type Selector */}
    <div className="grid grid-cols-4 items-center gap-4">
      <Label className="text-right">DB Type</Label>
      <div className="col-span-3">
        <Select 
          value={config.type} 
          onValueChange={(val) => setConfig({ ...config, type: val as DbType })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="postgres">PostgreSQL</SelectItem>
            <SelectItem value="sqlserver">SQL Server (MSSQL)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="grid grid-cols-4 items-center gap-4">
      <Label className="text-right">Host / Server</Label>
      <Input 
        value={config.host} 
        onChange={(e) => setConfig({...config, host: e.target.value})} 
        className="col-span-3" 
        placeholder={config.type === 'postgres' ? "localhost" : "SERVERNAME\\INSTANCE"}
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label className="text-right">Port</Label>
      <Input 
        value={config.port} 
        onChange={(e) => setConfig({...config, port: e.target.value})} 
        className="col-span-3" 
        placeholder={config.type === 'postgres' ? "5432" : "1433"}
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label className="text-right">Database</Label>
      <Input 
        value={config.db} 
        onChange={(e) => setConfig({...config, db: e.target.value})} 
        className="col-span-3" 
        placeholder="Database Name"
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label className="text-right">User</Label>
      <Input 
        value={config.user} 
        onChange={(e) => setConfig({...config, user: e.target.value})} 
        className="col-span-3" 
        placeholder="Username"
      />
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label className="text-right">Password</Label>
      <Input 
        type="password"
        value={config.pass} 
        onChange={(e) => setConfig({...config, pass: e.target.value})} 
        className="col-span-3" 
        placeholder="Password"
      />
    </div>

    {/* Added Test Button */}
    <div className="flex justify-end pt-2">
      <Button 
        type="button" 
        variant="secondary" 
        size="sm"
        onClick={() => onTest(config)}
      >
        Test Connection
      </Button>
    </div>
  </div>
);

export function SettingsDialog({
  open,
  onOpenChange,
  finDb,
  manDb,
  onSave,
}: SettingsDialogProps) {
  
  // Helper to parse connection string and detect type
  const parseConn = (connStr: string): DbConfig => {
    // Heuristic: If it has semicolons or 'server=', it's likely SQL Server.
    const isSqlServer = connStr.includes(';') || connStr.toLowerCase().includes('server=');
    const delimiter = isSqlServer ? ';' : ' ';
    
    // Default config
    const config: DbConfig = { 
      type: isSqlServer ? 'sqlserver' : 'postgres', 
      host: '', port: '', db: '', user: '', pass: '' 
    };
    
    const parts = connStr.split(delimiter);
    parts.forEach(part => {
      if (!part.trim()) return;
      
      const [key, ...valParts] = part.split('=');
      if (!key || valParts.length === 0) return;
      
      const val = valParts.join('='); 
      const lowerKey = key.trim().toLowerCase();
      const value = val.trim();
      
      if (lowerKey === 'host' || lowerKey === 'server') config.host = value;
      else if (lowerKey === 'port') config.port = value;
      else if (lowerKey === 'dbname' || lowerKey === 'database') config.db = value;
      else if (lowerKey === 'user' || lowerKey === 'user id') config.user = value;
      else if (lowerKey === 'password' || lowerKey === 'pwd') config.pass = value;
    });
    return config;
  };

  const [finConfig, setFinConfig] = useState<DbConfig>(parseConn(finDb));
  const [manConfig, setManConfig] = useState<DbConfig>(parseConn(manDb));

  useEffect(() => {
    if (open) {
      setFinConfig(parseConn(finDb));
      setManConfig(parseConn(manDb));
    }
  }, [open, finDb, manDb]);

  const buildConnString = (config: DbConfig) => {
    if (config.type === 'postgres') {
      // Postgres: Space separated
      const parts = [];
      if (config.host) parts.push(`host=${config.host}`);
      if (config.port) parts.push(`port=${config.port}`);
      if (config.db) parts.push(`dbname=${config.db}`);
      if (config.user) parts.push(`user=${config.user}`);
      if (config.pass) parts.push(`password=${config.pass}`);
      parts.push("sslmode=disable");
      return parts.join(' '); 
    } else {
      // SQL Server: Semicolon separated
      const parts = [];
      if (config.host) parts.push(`server=${config.host}`);
      if (config.port) parts.push(`port=${config.port}`);
      if (config.db) parts.push(`database=${config.db}`);
      if (config.user) parts.push(`user id=${config.user}`);
      if (config.pass) parts.push(`password=${config.pass}`);
      return parts.join(';'); 
    }
  };

  // Added handleTest function
  const handleTest = async (config: DbConfig) => {
    const connStr = buildConnString(config);
    if (!connStr) {
        toast.error("Invalid configuration parameters");
        return;
    }

    const toastId = toast.loading("Testing connection...");

    try {
      const response = await apiClient.post("/config/test", {
        connection_string: connStr
      });

      if (response.data.success) {
        toast.success("Connection Successful!", { id: toastId });
      } else {
        toast.error(`Connection Failed: ${response.data.error}`, { id: toastId });
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to reach server or invalid request", { id: toastId });
    }
  };

  const handleSave = () => {
    const newFinStr = buildConnString(finConfig);
    const newManStr = buildConnString(manConfig);
    onSave(newFinStr, newManStr);
    toast.success("Settings saved.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Database Configuration</DialogTitle>
          <DialogDescription>
            Configure connection details. Select type (Postgres vs SQL Server).
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="finance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="finance">Finance DB</TabsTrigger>
            <TabsTrigger value="manufacturing">Manufacturing DB</TabsTrigger>
          </TabsList>
          <TabsContent value="finance">
            {/* Added onTest prop */}
            <ConfigForm config={finConfig} setConfig={setFinConfig} onTest={handleTest} label="Finance" />
          </TabsContent>
          <TabsContent value="manufacturing">
            {/* Added onTest prop */}
            <ConfigForm config={manConfig} setConfig={setManConfig} onTest={handleTest} label="Manufacturing" />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}