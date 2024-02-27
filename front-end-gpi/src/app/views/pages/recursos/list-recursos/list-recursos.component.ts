import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EmpleadoService } from 'src/app/service/empleado.service';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Empleado } from 'src/app/model/empleado';
import { RecursoActividadService } from 'src/app/service/recurso-actividad.service';
import { RecursoActividad } from 'src/app/model/recurso-actividad';
@Component({
    selector: 'app-list-recursos',
    templateUrl: './list-recursos.component.html',
    styleUrls: ['./list-recursos.component.scss']
})
export class ListRecursosComponent implements OnInit {

    empleados: Empleado[];
    dataSource = new MatTableDataSource();
    idToDelete: number = undefined;

    empleadoForDates: Empleado = new Empleado();
    fechasAsigRecursoActividad: RecursoActividad[] = [];
    dataSourceFechasAsigRecursoActividad: RecursoActividad[] = [];
    modalShowDatesActividad: NgbModalRef;
    modalConfirmFechaAsig: NgbModalRef;
    idDeleteRecursoActividad: number = undefined;

    dateOptions: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    };

    constructor(private empleadoService: EmpleadoService,
        private recursoActService: RecursoActividadService,
        private modalService: NgbModal,
        private router: Router,
        private toastr: ToastrService) { }

    columnas: string[] = ['nombre', 'cargo', 'dependencia', 'estado', 'fechas', 'editar', 'eliminar'];
    session = localStorage.getItem('session');

    ngOnInit(): void {
        this.session = JSON.parse(this.session);

        if (this.session['rol'] != 'ROL_ADMIN' && this.session['rol'] != 'ROL_GP' && this.session['rol'] != 'ROL_LP' && this.session['rol'] != 'ROL_DP') {
            this.router.navigate(['/error']);
            return;
        }

        this.getEmpleados();
    }

    filtrar(event: Event) {
        console.log(this.dataSource);
        const filtro = (event.target as HTMLInputElement).value;
        console.log(filtro);
        this.dataSource.filter = filtro.trim().toLowerCase();
    }

    private getEmpleados() {
        this.empleadoService.getEmpleadosList().subscribe(data => {
            data.sort((a, b) => (a.nombre < b.nombre ? -1 : 1));
            this.empleados = data;
            this.dataSource = new MatTableDataSource(this.castListObjectToStringList(this.empleados));
        }, error => console.log(error));
    }

    


    updateEmpleado(id: number) {
        this.router.navigate(['recursos/editar/', id]);
    }

    deleteModal(content, id: number) {
        this.modalService.open(content);
        this.idToDelete = id;
    }

    deleteRecurso() {
        this.empleadoService.deleteEmpleado(this.idToDelete).subscribe(data => {
            this.idToDelete = undefined;
            this.modalService.dismissAll();
            this.getEmpleados();
            this.toastr.warning('Recurso eliminado correctamente!');
        }, error => {
            //this.toastr.error(error.message);
            this.modalService.dismissAll();
            console.log(error.error);
        });
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

            listString.push(string);
        });

        return listString;
    }

    openDatesActividadModal(content, emplead: Empleado) {
        this.empleadoForDates = emplead;
        this.getFechasAsignadsEmpleado(emplead.id);

        this.modalShowDatesActividad = this.modalService.open(content);
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
}

