import { Cliente } from "./cliente";
import { Empleado } from "./empleado";

export class ParametriaRecursosMatrizTiempo {
    id: number;
    empleado: Empleado;
    tarifaHora: number;
    tarifaMensual: number;
    cliente: Cliente;
}