
"use client";

import {  useState } from "react";

export default function AuditLog({ expenseId }) {
    const [auditLogsVisible, setAuditLogsVisible] = useState(false);
    const [auditLogs, setAuditLogs] = useState([]);

const handleAuditLogsClick = async () => {
        setAuditLogsVisible(true);
        
            const response = await fetch("/api/audit-log/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: expenseId }),
            });
            const result = await response.json();

            
            

            if (!response.ok) {
                throw new Error(result.error || "Could not load expenses.");
            }

            setAuditLogs(result.auditLog);

            
            
            
        
    }

    return (
   <>     

{auditLogsVisible && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="w-full max-w-lg rounded-lg bg-white p-6">
                    <h2 className="text-lg font-semibold text-slate-900">Audit Logs</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Here you can view the audit logs for this expense.
                    </p>
                    <div className="mt-4 space-y-2">
                        {auditLogs.map((log) => (
                            <div key={log.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-medium text-slate-900">{log.action}</p>
                                <p className="mt-1 text-xs text-slate-500">{log.name}</p>
                                <p className="mt-1 text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</p>

                                {log.details &&  (
                                    <p className="mt-1 text-xs text-slate-500">
                                        Remarks: {JSON.parse(log.details).comments}
                                    </p>
                                )}
                            </div> 
                        ))}
                    </div>
                    <button
                        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        onClick={() => setAuditLogsVisible(false)}
                    >
                        Close
                    </button>
                </div>
            </div>
        )}


                                    <button onClick={handleAuditLogsClick}
                                        className="mt-2 rounded-lg bg-emerald-700 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-800" 
                                        >Audit Logs</button>

                    
</>
    );
}
