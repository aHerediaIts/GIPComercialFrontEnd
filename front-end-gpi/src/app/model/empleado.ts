import { TipoDocumento } from './tipo-documento';
import { DependenciaEmpleado } from './dependencia-empleado';
import { Cargo } from './cargo';
import { EstadoEmpleado } from './estado-empleado';
import { EmpleadoEspecialidad } from './empleado-especialidad';
import { Rol } from './rol';
import { RolSeg } from './rol-seg';


export class Empleado{
    id: number;
    numero: string;
    nombre: string;
    email: string;
    scotiaID: string;
    documento: TipoDocumento;
    dependencia: DependenciaEmpleado;
    cargo: Cargo;
    estado: EstadoEmpleado;
    especialidad: EmpleadoEspecialidad;
    rol: Rol;
    rolSeg: RolSeg;
    
}