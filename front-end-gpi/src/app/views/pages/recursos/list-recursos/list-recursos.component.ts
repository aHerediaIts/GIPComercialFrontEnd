import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { EmpleadoService } from 'src/app/service/empleado.service';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Empleado } from 'src/app/model/empleado';
import { RecursoActividadService } from 'src/app/service/recurso-actividad.service';
import { RecursoActividad } from 'src/app/model/recurso-actividad';
import { ParametriaRecursosMatrizTiempo } from 'src/app/model/parametria-recursos-matriz-tiempo';
import { ParametriaRecursosMatrizTiempoService } from 'src/app/service/matriz-tiempos-parametria-recursos.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ClienteService } from 'src/app/service/cliente.service';
import { Cliente } from 'src/app/model/cliente';
import { MatSort, Sort } from '@angular/material/sort';
@Component({
    selector: 'app-list-recursos',
    templateUrl: './list-recursos.component.html',
    styleUrls: ['./list-recursos.component.scss']
})
export class ListRecursosComponent implements OnInit {

    defaultNavActiveId = 1;
    editMode: boolean = true;
    recursoExist: boolean = false;
    tarifaHoraFormatter: string = '';
    tarifaMesFormatter: string = '';
    title: string = '';
    navName: string = '';
    parametrosRecurso: ParametriaRecursosMatrizTiempo = new ParametriaRecursosMatrizTiempo();
    recursos: ParametriaRecursosMatrizTiempo[];
    empleados: Empleado[];
    empleadosList: Empleado[];
    clientes: Cliente[];
    dataSource = new MatTableDataSource();
    dataSourceParametros = new MatTableDataSource();
    idToDelete: number = undefined;
    idDeleteRecursoActividad: number = undefined;
    empleadoForDates: Empleado = new Empleado();
    fechasAsigRecursoActividad: RecursoActividad[] = [];
    dataSourceFechasAsigRecursoActividad: RecursoActividad[] = [];
    modalShowDatesActividad: NgbModalRef;
    modalConfirmFechaAsig: NgbModalRef;
    modalAgregarPerfil: NgbModalRef;
    formParametrosRecursos: FormGroup;

    dateOptions: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    };

    constructor(private empleadoService: EmpleadoService,
        private clienteService: ClienteService,
        private recursoActService: RecursoActividadService,
        private parametriaRecursosService: ParametriaRecursosMatrizTiempoService,
        private modalService: NgbModal,
        private formBuilder: FormBuilder,
        private router: Router,
        private toastr: ToastrService) { }
    @ViewChild(MatSort) sort: MatSort;

    columnas: string[] = ['nombre', 'cargo', 'dependencia', 'estado', 'ID-Recurso', 'fechas', 'editar', 'eliminar'];
    columnasParametros: string[] = ['nombre', 'tarifaHora', 'tarifaMensual', 'cliente', 'opciones']
    session = localStorage.getItem('session');

    ngOnInit(): void {
        this.session = JSON.parse(this.session);

        if (this.session['rol'] != 'ROL_ADMIN' && this.session['rol'] != 'ROL_GP' && this.session['rol'] != 'ROL_LP' && this.session['rol'] != 'ROL_DP') {
            this.router.navigate(['/error']);
            return;
        }

        this.getEmpleados();
        this.getAllEmpleados();
        this.getClientes();
        this.getRecursos();
        this.buildParametrosRecursos();
    }

    sortData(sort: Sort) {
        const data: EmpleadoString[] = this.dataSource.data.slice() as EmpleadoString[];
        if (!sort.active || sort.direction === '') {
            this.dataSource.data = data;
            return;
        }
        data.sort((a, b) => {
            const isAsc = sort.direction === 'asc';
            return this.onCondition(sort.active, isAsc, a, b);
        });
        this.dataSource.data = data;
    }

    sortDataParm(sort: Sort){
        const data: RecursosString[] = this.dataSourceParametros.data.slice() as RecursosString[];
        if (!sort.active || sort.direction === '') {
            this.dataSourceParametros.data = data;
            return;
        }
        data.sort((a, b) => {
            const isAsc = sort.direction === 'asc';
            return this.onConditionParm(sort.active, isAsc, a, b);
        });
        this.dataSourceParametros.data = data;
    }

    onConditionParm(activo: string, orden: boolean, a: RecursosString, b: RecursosString) {
        switch (activo) {
            case 'nombre': return this.compare(a.nombre, b.nombre, orden);
            case 'cliente': return this.compare(a.cliente, b.cliente, orden);
            case 'tarifaHora': return this.compare(a.tarifaHora, b.tarifaHora, orden);
            case 'tarifaMensual': return this.compare(a.tarifaMensual, b.tarifaMensual, orden);
            default: return 0;
        }
    }

    onCondition(activo: string, orden: boolean, a: EmpleadoString, b: EmpleadoString) {
        switch (activo) {
            case 'nombre': return this.compare(a.nombre, b.nombre, orden);
            case 'cargo': return this.compare(a.cargo, b.cargo, orden);
            case 'dependencia': return this.compare(a.dependencia, b.dependencia, orden);
            case 'estado': return this.compare(a.estado, b.estado, orden);
            case 'ID-Recurso': return this.compare(a.scotiaID, b.scotiaID, orden);
            default: return 0;
        }
    }

    compare(a: string | number, b: string | number, isAsc: boolean) {
        return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    }

    get r() { return this.formParametrosRecursos.controls; }

    buildParametrosRecursos() {
        this.formParametrosRecursos = this.formBuilder.group({
            empleado: ['', Validators.required],
            cliente: ['', Validators.required],
            tarifaHora: ['', [Validators.required, Validators.pattern('\\$[1-9][0-9]{0,2}(\\.\\d{3})*(,\\d+)?')]],
            tarifaMensual: ['', [Validators.required, Validators.pattern('\\$[1-9][0-9]{0,2}(\\.\\d{3})*(,\\d+)?')]]
        });
    }

    validarNumeros(event: KeyboardEvent) {
        const codigoTecla = event.keyCode;
        if (
            (codigoTecla < 48 || codigoTecla > 57) &&
            codigoTecla !== 8 &&
            codigoTecla !== 9
        ) {
            event.preventDefault();
        }
    }

    saveParametrosRecursos() {
        if (this.formParametrosRecursos.invalid || this.parametrosRecurso.tarifaHora === 0 || this.parametrosRecurso.tarifaMensual === 0) {
            this.formParametrosRecursos.markAllAsTouched();
            return;
        }

        this.recursoExist = false;

        this.recursos.forEach(recurso => {
            if (recurso.cliente.nombre === this.parametrosRecurso.cliente.nombre && recurso.empleado.nombre === this.parametrosRecurso.empleado.nombre) {
                this.recursoExist = true;
                return;
            }
        });

        if (!this.recursoExist) {
            this.parametrosRecurso.tarifaHora = parseInt(this.tarifaHoraFormatter.replace(/[^\d]/g, ''));
            this.parametrosRecurso.tarifaMensual = parseInt(this.tarifaMesFormatter.replace(/[^\d]/g, ''));
            if (this.editMode) {
                this.parametriaRecursosService.saveParametriaRecursos(this.parametrosRecurso).subscribe(data => {
                    this.toastr.success('Se agrega parametrización satisfactoriamente');
                    this.modalAgregarPerfil.close();
                    this.clearRecurso();
                    this.getRecursos();
                }, error => {
                    this.toastr.error(error.message)
                });
            } else {
                console.log(this.parametrosRecurso)
                this.parametriaRecursosService.updateParametriaRecursos(this.parametrosRecurso.id, this.parametrosRecurso).subscribe(data => {
                    this.toastr.success('Se actualizo la parametrización satisfactoriamente')
                    this.modalAgregarPerfil.close();
                    this.clearRecurso();
                    this.getRecursos();
                }, error => {
                    this.toastr.error(error.error.message)
                })
            }
        } else {
            this.toastr.warning("El recurso ya tiene parametros asociados al cliente ", this.parametrosRecurso.cliente.nombre)
        }
    }

    clearRecurso() {
        this.parametrosRecurso = new ParametriaRecursosMatrizTiempo();
        this.tarifaHoraFormatter = '';
        this.tarifaMesFormatter = '';
        this.formParametrosRecursos.markAsUntouched();
        this.editMode = true;
    }

    filtrarRecurso(event: Event) {
        const filtro = (event.target as HTMLInputElement).value;
        this.dataSourceParametros.filter = filtro.trim().toLowerCase();
    }

    filtrar(event: Event) {
        const filtro = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filtro.trim().toLowerCase();
    }

    private getRecursos() {
        this.parametriaRecursosService.getParametriaRecursos().subscribe(data => {
            data.sort((a, b) => (a.empleado.nombre < b.empleado.nombre ? -1 : 1));
            this.recursos = data;
            this.dataSourceParametros = new MatTableDataSource(this.castListRecursoToStringList(this.recursos));
        }, error => {
            console.log(error);
        });
    }

    getRecurso(id: number) {
        this.parametriaRecursosService.searchParametriaRecursos(id).subscribe(data => {
            this.parametrosRecurso = data;
            this.tarifaMesFormatter = this.formatTarifa(data.tarifaMensual.toString());
            this.tarifaHoraFormatter = this.formatTarifa(data.tarifaHora.toString());
        }, error => {
            console.log(error);
        });
    }

    private getClientes() {
        this.clienteService.getClientesList().subscribe(data => {
            data.sort((a, b) => (a.nombre < b.nombre ? -1 : 1));
            this.clientes = data;
        }, error => {
            console.log(error);
        });
    }

    private getAllEmpleados() {
        this.empleadoService.getEmpleadosList().subscribe(data => {
            data.sort((a, b) => (a.nombre < b.nombre ? -1 : 1));
            this.empleadosList = data;
        }, error => {
            console.log(error);
        });
    }

    private getEmpleados() {
        this.empleadoService.getEmpleadosList().subscribe(data => {
            data.sort((a, b) => (a.nombre < b.nombre ? -1 : 1));
            this.empleados = data;
            for (let i = 0; i < this.empleados.length; i++) {
                const empleado = this.empleados[i];
                if (empleado.scotiaID == undefined) {
                    this.empleados[i].scotiaID = "N/A";
                }
            }
            this.dataSource = new MatTableDataSource(this.castListObjectToStringList(this.empleados));
        }, error => console.log(error));
    }

    updateEmpleado(id: number) {
        this.router.navigate(['recursos/editar/', id]);
    }

    deleteModal(content, id: number, nav: string) {
        this.modalService.open(content);
        this.idToDelete = id;
        this.navName = nav;
    }

    deleteRecurso() {
        if (this.navName === 'ADMIN') {
            this.empleadoService.deleteEmpleado(this.idToDelete).subscribe(data => {
                this.idToDelete = undefined;
                this.modalService.dismissAll();
                this.getEmpleados();
                this.toastr.warning('Recurso eliminado correctamente!');
            }, error => {
                this.modalService.dismissAll();
                console.log(error.error);
            });
        } else if (this.navName === 'PARMS') {
            this.parametriaRecursosService.deleteParametriaRecursos(this.idToDelete).subscribe(data => {
                this.idToDelete = undefined;
                this.modalService.dismissAll();
                this.getRecursos();
                this.toastr.warning('Recurso eliminado correctamente!');
            }, error => {
                this.modalService.dismissAll();
                console.log(error);
            });
        }
    }

    formatTarifa(tarifa: string) {

        if (!tarifa.startsWith('$')) {
            tarifa = `$${tarifa}`;
        }

        tarifa = tarifa.replace(/\./g, '')
        tarifa = tarifa.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return tarifa;
    }

    castListRecursoToStringList(ListaObj: ParametriaRecursosMatrizTiempo[]) {
        let listString: RecursosString[] = [];
        ListaObj.forEach(rec => {
            let string: RecursosString = new RecursosString();
            string.id = rec.id;
            string.cliente = rec.cliente.nombre;
            string.nombre = rec.empleado.nombre;
            string.tarifaHora = this.formatTarifa(rec.tarifaHora.toString());
            string.tarifaMensual = this.formatTarifa(rec.tarifaMensual.toString());
            listString.push(string);
        })
        return listString;
    }

    castListObjectToStringList(listaObj: Empleado[]) {
        let listString: EmpleadoString[] = [];

        listaObj.forEach(obj => {
            let string: EmpleadoString = new EmpleadoString();
            string.id = obj.id;
            string.numero = obj.numero;
            string.nombre = obj.nombre;
            string.email = obj.email;
            string.nombre = obj.nombre;
            string.dependencia = obj.dependencia.dependencia;
            string.cargo = obj.cargo.cargo;
            string.estado = obj.estado.estado;
            string.scotiaID = obj.scotiaID;
            listString.push(string);
        });

        return listString;
    }

    openDatesActividadModal(content, emplead: Empleado) {
        this.empleadoForDates = emplead;
        this.getFechasAsignadsEmpleado(emplead.id);

        this.modalShowDatesActividad = this.modalService.open(content);
    }

    openModalRecurso(content, type: string) {
        if (type === 'add') {
            this.clearRecurso();
            this.editMode = true;
            this.title = "Parametrizar Recurso";
        } else {
            this.editMode = false;
            this.title = "Actualizar Recurso";
        }
        this.modalAgregarPerfil = this.modalService.open(content);
    }

    getFechasAsignadsEmpleado(idEmpleado: number) {
        this.recursoActService.findByEmpleado(idEmpleado).subscribe(data => {
            data.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
            this.fechasAsigRecursoActividad = data;
            this.dataSourceFechasAsigRecursoActividad = data;
        }, error => {
            this.toastr.error(error);
        });
    }

    openConfirmFechaAsig(content, id: number) {
        this.idDeleteRecursoActividad = id;
        this.modalConfirmFechaAsig = this.modalService.open(content);
    }

    closeConfirmFechaAsig() {
        this.modalConfirmFechaAsig.close();
    }

    deleteFechaAsignada() {
        this.recursoActService.deleteRecursoActividad(this.idDeleteRecursoActividad).subscribe(data => {
            this.toastr.warning('Se ha eliminado la fecha planeada correctamente');
            this.closeConfirmFechaAsig();
            this.getFechasAsignadsEmpleado(this.empleadoForDates.id);
        }, error => this.toastr.error(error));
    }

    filtrarDates(event: any) {
        const dataSourceFechas = this.dataSourceFechasAsigRecursoActividad.slice();
        const filtro = event.target.value.trim().toLowerCase();
        if (filtro == '') {
            this.fechasAsigRecursoActividad = dataSourceFechas;
        } else {
            const regExpDates = /( de |, )\b/g;
            try {
                this.fechasAsigRecursoActividad = dataSourceFechas.filter(item =>
                    new Date(Number(item.fecha.toString().split('-')[0]), Number(item.fecha.toString().split('-')[1]) - 1, Number(item.fecha.toString().split('-')[2]), 12, 0, 0)
                        .toLocaleString("es-LA", this.dateOptions).toLowerCase().replace(regExpDates, ' ')
                        .indexOf(filtro) !== -1 ||
                    item.actividad.actividad.actividad.toLowerCase().indexOf(filtro) !== -1
                );
            }
            catch (error) {
                console.error(error);
            }
        }
    }
}

export class EmpleadoString {
    id: number;
    numero: string;
    nombre: string;
    email: string;
    documento: string;
    dependencia: string;
    cargo: string;
    estado: string;
    especialidad: string;
    scotiaID: string;
}

export class RecursosString {
    id: number;
    nombre: string;
    tarifaHora: string;
    tarifaMensual: string;
    cliente: string;
}

