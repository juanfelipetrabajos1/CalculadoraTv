"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calculator, Info, Trash2 } from "lucide-react"

interface TruthTableRow {
  [key: string]: boolean
}

interface LogicalOperator {
  symbol: string
  name: string
  description: string
  color: string
}

const operators: LogicalOperator[] = [
  { symbol: "∧", name: "Conjunción (Y)", description: "Y lógico", color: "bg-blue-500" },
  { symbol: "∨", name: "Disyunción (O)", description: "O lógico", color: "bg-green-500" },
  { symbol: "~", name: "Negación", description: "NO lógico", color: "bg-red-500" },
  { symbol: "→", name: "Implicación", description: "Si...entonces", color: "bg-yellow-500" },
  { symbol: "↔", name: "Bicondicional", description: "Si y solo si", color: "bg-purple-500" },
  { symbol: "⊕", name: "XOR", description: "OR exclusivo", color: "bg-orange-500" },
  { symbol: "(", name: "(", description: "Paréntesis", color: "bg-pink-500" },
  { symbol: ")", name: ")", description: "Paréntesis", color: "bg-pink-500" },
  { symbol: "P", name: "P", description: "Variable P", color: "bg-gray-500" },
  { symbol: "Q", name: "Q", description: "Variable Q", color: "bg-red-500" },
  { symbol: "R", name: "R", description: "Variable R", color: "bg-blue-500" },
]

export default function TruthTableCalculator() {
  const [expression, setExpression] = useState("")
  const [truthTable, setTruthTable] = useState<TruthTableRow[]>([])
  const [variables, setVariables] = useState<string[]>([])
  const [error, setError] = useState("")
  const [isCalculating, setIsCalculating] = useState(false)

  const insertOperator = (operator: string) => {
    setExpression((prev) => prev + operator)
  }

  const extractVariables = (expr: string): string[] => {
    const matches = expr.match(/[a-zA-Z]/g)
    if (!matches) return []
    return [...new Set(matches)].sort()
  }

  const evaluateExpression = useCallback((expr: string, values: { [key: string]: boolean }): boolean => {
    let processedExpr = expr

    Object.entries(values).forEach(([variable, value]) => {
      const regex = new RegExp(variable, "g")
      processedExpr = processedExpr.replace(regex, value.toString())
    })

    processedExpr = processedExpr
      .replace(/∧/g, "&&")
      .replace(/∨/g, "||")
      .replace(/~/g, "!")
      .replace(/→/g, "<=")
      .replace(/↔/g, "==")
      .replace(/⊕/g, "!=")

    processedExpr = processedExpr.replace(/(\w+|$$[^)]+$$)\s*<=\s*(\w+|$$[^)]+$$)/g, "(!($1) || ($2))")

    try {
      return new Function("return " + processedExpr)()
    } catch {
      throw new Error("Expresión inválida")
    }
  }, [])

  const generateTruthTable = () => {
    if (!expression.trim()) {
      setError("Por favor ingresa una expresión lógica")
      return
    }

    setIsCalculating(true)
    setError("")

    try {
      const vars = extractVariables(expression)
      if (vars.length === 0) {
        setError("No se encontraron variables en la expresión")
        setIsCalculating(false)
        return
      }

      setVariables(vars)
      const numRows = Math.pow(2, vars.length)
      const table: TruthTableRow[] = []

      for (let i = 0; i < numRows; i++) {
        const row: TruthTableRow = {}

        vars.forEach((variable, index) => {
          row[variable] = Boolean((i >> (vars.length - 1 - index)) & 1)
        })

        try {
          row["resultado"] = evaluateExpression(expression, row)
        } catch (evalError) {
          throw new Error("Error al evaluar la expresión")
        }

        table.push(row)
      }

      setTruthTable(table)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsCalculating(false)
    }
  }

  const clearAll = () => {
    setExpression("")
    setTruthTable([])
    setVariables([])
    setError("")
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2 font-sans">Calculadora de Tablas de Verdad</h1>
        <p className="text-muted-foreground">
          Ingresa una expresión lógica y genera su tabla de verdad automáticamente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Expresión Lógica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  placeholder="Ejemplo: (p ∧ q) → r"
                  className="flex-1 text-lg"
                  onKeyDown={(e) => e.key === "Enter" && generateTruthTable()}
                />
                <Button onClick={generateTruthTable} disabled={isCalculating}>
                  {isCalculating ? "Calculando..." : "Calcular"}
                </Button>
                <Button variant="outline" onClick={clearAll}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {operators.map((op) => (
                  <Button
                    key={op.symbol}
                    variant="outline"
                    onClick={() => insertOperator(op.symbol)}
                    className="flex items-center gap-2 justify-start"
                  >
                    <span className={`w-6 h-6 rounded text-white text-sm flex items-center justify-center ${op.color}`}>
                      {op.symbol}
                    </span>
                    <span className="text-sm">{op.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Truth Table */}
          {truthTable.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tabla de Verdad</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Expresión: <code className="bg-muted px-2 py-1 rounded">{expression}</code>
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        {variables.map((variable) => (
                          <th key={variable} className="p-3 text-center font-semibold bg-muted">
                            {variable}
                          </th>
                        ))}
                        <th className="p-3 text-center font-semibold bg-primary text-primary-foreground">Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {truthTable.map((row, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-card" : "bg-muted/50"}>
                          {variables.map((variable) => (
                            <td key={variable} className="p-3 text-center">
                              <Badge variant={row[variable] ? "default" : "secondary"}>
                                {row[variable] ? "V" : "F"}
                              </Badge>
                            </td>
                          ))}
                          <td className="p-3 text-center">
                            <Badge variant={row.resultado ? "default" : "destructive"}>
                              {row.resultado ? "V" : "F"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Reference Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Conectivos Lógicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {operators.slice(0, 6).map((op) => (
                <div key={op.symbol} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <span
                    className={`w-8 h-8 rounded text-white flex items-center justify-center ${op.color} flex-shrink-0`}
                  >
                    {op.symbol}
                  </span>
                  <div>
                    <h4 className="font-semibold">{op.name}</h4>
                    <p className="text-sm text-muted-foreground">{op.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          
        </div>
      </div>
    </div>
  )
}
