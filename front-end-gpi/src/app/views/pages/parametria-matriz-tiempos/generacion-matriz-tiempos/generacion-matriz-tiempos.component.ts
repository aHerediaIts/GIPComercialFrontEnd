import { Component, OnInit, AfterViewInit, ViewChild, TemplateRef } from '@angular/core';
import { ProyectoService } from '../../../../service/proyecto.service';
import { Proyecto } from 'src/app/Model/proyecto';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { EstadoProyecto } from 'src/app/Model/estado-proyecto';
import { Cliente } from 'src/app/model/cliente';
import { EtapaProyecto } from 'src/app/Model/etapa-proyecto';
import { MatSort, Sort } from '@angular/material/sort';
import { GeneracionMatrizTiempoService } from 'src/app/service/generacion-matriz-tiempos-service';
import { ParametriaGeneralMatrizTiempoService } from 'src/app/service/matriz-tiempos-parametria-general.service';
import { ParametriaGeneralMatrizTiempo } from 'src/app/model/parametria-general-matriz-tiempo';
import { ParametriaRecursosMatrizTiempoService } from 'src/app/service/matriz-tiempos-parametria-recursos.service';
import { ParametriaRecursosMatrizTiempo } from 'src/app/model/parametria-recursos-matriz-tiempo';
import { VersionMatriz } from 'src/app/model/version-matriz';
import { finalize } from 'rxjs/operators';
import { Especialidad } from 'src/app/model/especialidad';
import { rescursoAsignado } from 'src/app/model/recurso-asignado';
import { EspecialidadService } from 'src/app/service/especialidad.service';
import { guardadoGeneral } from 'src/app/model/guardado-matriz-tiempos';
import { MatGridTileHeaderCssMatStyler } from '@angular/material/grid-list';
import { EspecialidadRecurso } from 'src/app/model/especialidad-recurso';
import { element } from 'protractor';

@Component({
    selector: 'app-generacion-matriz-tiempos',
    templateUrl: './generacion-matriz-tiempos.component.html',
    styleUrls: ['./generacion-matriz-tiempos.component.scss']
})

export class GeneracionMatrizTiempos implements OnInit {

    proyectos: Proyecto[] = new Array();
    estadoProyec: EstadoProyecto[] = new Array();
    client: Cliente[] = new Array();
    etap: EtapaProyecto[] = new Array();
    proyectoFiltro: Proyecto[] = new Array();

    estadosProyecto: EstadoProyecto[] = new Array();
    clientesProyectos: Cliente[] = new Array();
    etapasProyecto: EtapaProyecto[] = new Array();
    idToDelete: number;
    permissionP: boolean = true;
    permissionF: boolean = true;

    dataBeta: any[] = [];
    dataGama: any[] = [];
    dataOmega: any[] = [];
    generacionMatrizTiempo: GeneracionMatrizTiempo = new GeneracionMatrizTiempo();
    parametriaTiempoList: ParametriaGeneralMatrizTiempo = new ParametriaGeneralMatrizTiempo();
    dataSource = new MatTableDataSource();
    modalEliminar: NgbModalRef;
    opcionesSprints = [];
    opcionesDuracion = [];
    guardadoGeneral: guardadoGeneral = new guardadoGeneral();
    modalConfirmar = NgbModalRef;

    //-------------------------------
    showTable = false;
    versionesConfiguradas: VersionMatriz[] = new Array();
    versionesInforme: VersionMatriz[] = new Array();
    versionSeleccionada: VersionMatriz = new VersionMatriz();
    versionDiligenciada: number = 1;
    nombreMatriz: string;
    matrizGeneral: any[] = [];
    rowSave: boolean;
    tiposRecursos: ParametriaRecursosMatrizTiempo[] = [];
    dataSource2: any[] = [];
    especialidades: EspecialidadRecurso[] = [];
    dataSourceAsignacionRecursoBeta: any[] = [];
    Recursos: rescursoAsignado[] = [];
    recursoAsignado: rescursoAsignado = new rescursoAsignado();
    version_recurso: number;
    dias_sprint: number;
    RecursosHora: any[] = [];
    RecursosHoraTotal: any[] = [];
    SprintPorcentaje: any[] = [];
    infoVersion: any[] = [];
    version_matriz: number;
    rowRecursoSave: boolean;
    costoTotalSprint: any[] = [];
    totalPlaneacion: number = 0;
    listaRecursos: any[] = [];
    genInforme: boolean = true;
    selectEspecialidad: boolean = false;
    selectPerfil: boolean = false;
    tituloEspecialidad: string = "Seleccionar opción";
    tituloPerfil: string = "Seleccionar opción";
    deleteRowModal: number = 0;
    deleteRowSprint: number = 0;
    closeModal: NgbModalRef;
    closeModalSprint: NgbModalRef;

    constructor(private modalService: NgbModal,
        private especialidadService: EspecialidadService,
        private generacionMatrizTiempoService: GeneracionMatrizTiempoService,
        private parametriaGeneralMatrizTiempoService: ParametriaGeneralMatrizTiempoService,
        private parametriaRecursosMatrizTiempoService: ParametriaRecursosMatrizTiempoService,
        private router: Router,
        private toastr: ToastrService) { }

    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('confPage') confPage: any;

    columnas_recurso: string[] = ['Especialidad', 'Perfil', 'Porcentaje', 'Editar', 'Eliminar'];

    session = localStorage.getItem('session');

    ngOnInit(): void {
        this.session = JSON.parse(this.session);

        if (this.session['rol'] != 'ROL_ADMIN' && this.session['rol'] != 'ROL_LP' && this.session['rol'] != 'ROL_GP' && this.session['rol'] != 'ROL_DP' && this.session['rol'] != 'ROL_QA') {
            this.router.navigate(['/error']);
            return;
        }
        this.versionSeleccionada = null;
        this.getParametriaGeneral();
        this.getParametriaRecursos();
        this.getVersionesMatriz();
        this.getListEspecialidades();
    }

    getVersionesMatriz() {
        this.generacionMatrizTiempoService.getVersionesMatriz().subscribe(data => {
            this.versionesConfiguradas = data;
        }, error => console.log(error));
    }

    nuevaVersion() {
        this.showTable = true;
    }

    validarVersion(item: any): boolean {
        if (item.version.id == undefined || item.version.id == this.versionSeleccionada.id)
            return item;
    }

    addRow() {
        let filtradoVersion = [];
        this.matrizGeneral.forEach(planeacion => {
            if (planeacion.version.id == this.versionSeleccionada.id) {
                filtradoVersion.push(planeacion);
            }
        });

        if (filtradoVersion.length < this.parametriaTiempoList.sprintsMaximo) {
            this.matrizGeneral.push({
                "sprint": filtradoVersion.length + 1,
                "duracionDiasSprint": this.opcionesDuracion[0],
                "version": this.versionSeleccionada,
                "editing": true
            });
            this.rowSave = true;
            this.genInforme = true;
        } else {
            this.toastr.error('Se excede el límite de sprints máximo definido');
        }
    }

    removeItemSprint(index: number, content) {
        this.deleteRowSprint = index;
        this.closeModalSprint = this.modalService.open(content)
    }

    openDeleteRow() {
        for (let i = this.dataSourceAsignacionRecursoBeta.length - 1; i >= 0; i--) {
            if (this.matrizGeneral[this.deleteRowSprint].sprint === this.dataSourceAsignacionRecursoBeta[i].Version.sprint && this.matrizGeneral[this.deleteRowSprint].version.version === this.dataSourceAsignacionRecursoBeta[i].Version.version.version) {
                this.dataSourceAsignacionRecursoBeta.splice(i, 1);
            }
        }

        this.matrizGeneral.splice(this.deleteRowSprint, 1);
        let sprintNumber = 1;

        this.matrizGeneral.forEach(element => {
            if(element.version.version === this.versionSeleccionada.version){
                element.sprint = sprintNumber;
                sprintNumber += 1;
            }
        })

        this.closeModalSprint.close();
    }


    openDeleteModel(index: number, content) {
        this.deleteRowModal = index;
        this.closeModal = this.modalService.open(content);
    }

    removeItem() {
        if (this.deleteRowModal >= 0 && this.deleteRowModal < this.dataSourceAsignacionRecursoBeta.length) {
            this.dataSourceAsignacionRecursoBeta.splice(this.deleteRowModal, 1);
        }
        this.closeModal.close();
    }

    toggleEdit(index: number) {
        const itemBeta = this.matrizGeneral[index];
        itemBeta.editing = !itemBeta.editing;
        itemBeta.totalHorasSprint = itemBeta.duracionDiasSprint * this.parametriaTiempoList.numeroHoras
        itemBeta.totalHorasRecursoSprint = (itemBeta.duracionDiasSprint * this.parametriaTiempoList.numeroHoras) * 4
        this.versionDiligenciada = this.versionSeleccionada.id + 1;
        this.rowSave = !this.rowSave;
        this.genInforme = !this.genInforme;
    }

    getParametriaGeneral() {
        this.parametriaGeneralMatrizTiempoService.getParametriaGeneral().pipe(finalize(() => this.llenarSelectParametria())
        ).subscribe(data => {
            this.parametriaTiempoList = data;
        }, error => console.log(error));
    }

    llenarSelectParametria() {
        this.opcionesSprints = [], this.opcionesDuracion = [];
        for (let index = 1; index <= this.parametriaTiempoList.sprintsMaximo; index++) {
            this.opcionesSprints.push(index);
        }
        for (let index = 1; index <= this.parametriaTiempoList.diaSprintMaximo; index++) {
            this.opcionesDuracion.push(index);
        }
    }

    saveGeneracionTiempos() {
        this.saveRecursoAsignado();
        this.guardadoGeneral.recursosAsignados = this.Recursos;
        this.guardadoGeneral.matrizTiempo = this.matrizGeneral;
        this.generacionMatrizTiempoService.saveGeneracionTiempos(this.guardadoGeneral, this.nombreMatriz).pipe(finalize(() => location.reload())
        ).subscribe(data => {
            this.toastr.success('Se guardo correctamente');
            this.generacionMatrizTiempo = new GeneracionMatrizTiempo;
        }, error => this.toastr.error(error.message));
    }

    sumaData() {
        let dias = 0;
        this.matrizGeneral.forEach(item => {
            dias += item.duracionDiasSprint;
        });
        return dias;
    }

    mesesVersion(version?: number | undefined) {
        let dias = 0;
        if (version == undefined) {
            this.matrizGeneral.forEach(matriz => {
                dias = dias + matriz.duracionDiasSprint;
            });
        } else {
            this.matrizGeneral.forEach(matriz => {
                if (matriz.version.id == version) {
                    dias = dias + matriz.duracionDiasSprint;
                }
            });
        }
        return dias;
    }

    sumaDataHora() {
        let horasSprint = 0;
        this.matrizGeneral.forEach(item => {
            horasSprint += item.duracionDiasSprint * this.parametriaTiempoList.numeroHoras;
        });
        return horasSprint;
    }

    sumaDataHoraRecurso() {
        let horasSprintRecurso = 0;
        let iteracion = this.matrizGeneral.length - (this.matrizGeneral.length - this.SprintPorcentaje.length);

        for (let i = 0; i < iteracion; i++) {
            if (this.SprintPorcentaje[i].porcentaje !== undefined) {
                horasSprintRecurso += Math.ceil(this.matrizGeneral[i].duracionDiasSprint * this.parametriaTiempoList.numeroHoras * this.SprintPorcentaje[i].porcentaje);
            }
        }

        return horasSprintRecurso;
    }

    openXlModal(content: TemplateRef<any>) {
        console.log("OBJETO A ARMAR");
        console.log(this.dataSourceAsignacionRecursoBeta);
        this.modalService.open(content, { size: 'xl' }).result.then((result) => {
        }).catch((res) => { });
        this.versionesInforme = [];
        this.matrizGeneral.forEach(matrizGeneral => {
            this.versionesInforme.push(matrizGeneral.version);
        });
        this.versionesInforme = [...new Set(this.versionesInforme)];
        this.PorcentajeSprint()
        this.calculosGeneral();
        console.log(this.recursoAsignado)
    }

    validarPorcentaje(index: number) {
        if (this.dataSourceAsignacionRecursoBeta[index].Porcentaje < 0) {
            this.dataSourceAsignacionRecursoBeta[index].Porcentaje = 0;
        } else if (this.dataSourceAsignacionRecursoBeta[index].Porcentaje > 100) {
            this.dataSourceAsignacionRecursoBeta[index].Porcentaje = 100;
        } else if (this.dataSourceAsignacionRecursoBeta[index].Porcentaje === null) {
            this.dataSourceAsignacionRecursoBeta[index].Porcentaje = '';
        }
    }

    calculosGeneral() {
        this.RecursosHora.length = 0;
        this.RecursosHoraTotal.length = 0;
        this.costoTotalSprint.length = 0;
        this.listaRecursos.length = 0;
        let PorcentajeAcumulado: number = 0;
        let cargo: string = '';
        let especialidad: string = '';
        let Total: number = 0;
        let TotalHoras: number = 0;
        let TotalTarifa: number = 0;
        let tarifa: number = 0;
        let horas: number = 0;
        let costoSprint: number = 0;
        let costoVersion: number = 0;
        this.totalPlaneacion = 0;
        let Recurso = '';

        for (let i = 0; i < this.tiposRecursos.length; i++) {
            for (let j = 0; j < this.dataSourceAsignacionRecursoBeta.length; j++) {
                if (this.tiposRecursos[i].especialidad.especialidad === this.dataSourceAsignacionRecursoBeta[j].Especialidad.especialidad && this.tiposRecursos[i].perfil.perfil === this.dataSourceAsignacionRecursoBeta[j].Perfil.perfil.perfil) {
                    Recurso = this.tiposRecursos[i].perfil.perfil;
                    break
                }
            }
            if (Recurso !== '') {
                this.listaRecursos.push({ Cargo: Recurso, Especialidad: this.tiposRecursos[i].especialidad.especialidad });
            }
            Recurso = '';
        }

        for (let i = 0; i < this.matrizGeneral.length; i++) {
            for (let j = 0; j < this.listaRecursos.length; j++) {
                cargo = this.listaRecursos[j].Cargo;
                especialidad = this.listaRecursos[j].Especialidad;

                for (let k = 0; k < this.dataSourceAsignacionRecursoBeta.length; k++) {
                    if (this.matrizGeneral[i].sprint === this.dataSourceAsignacionRecursoBeta[k].Version.sprint && this.matrizGeneral[i].version.version === this.dataSourceAsignacionRecursoBeta[k].Version.version.version && this.listaRecursos[j].Cargo === this.dataSourceAsignacionRecursoBeta[k].Perfil.perfil.perfil && this.listaRecursos[j].Especialidad === this.dataSourceAsignacionRecursoBeta[k].Especialidad.especialidad) {
                        
                        PorcentajeAcumulado += this.dataSourceAsignacionRecursoBeta[k].Porcentaje;
                        horas = Math.ceil(this.parametriaTiempoList.numeroHoras * this.dataSourceAsignacionRecursoBeta[k].Version.duracionDiasSprint * PorcentajeAcumulado / 100);
                        tarifa = this.dataSourceAsignacionRecursoBeta[k].Perfil.tarifaHora * horas;
                    }
                }
                this.RecursosHora.push({ Sprint: this.matrizGeneral[i].sprint, Version: this.matrizGeneral[i].version.version, Porcentaje: PorcentajeAcumulado / 100, Cargo: cargo, Especialidad: especialidad, tarifaHora: tarifa, Horas: horas });
                PorcentajeAcumulado = 0;
                horas = 0;
                tarifa = 0;
            }
        }

        for (let i = 0; i < this.listaRecursos.length; i++) {
            for (let j = 0; j < this.RecursosHora.length; j++) {
                if (this.listaRecursos[i].Cargo === this.RecursosHora[j].Cargo && this.listaRecursos[i].Especialidad === this.RecursosHora[j].Especialidad) {
                    Total += this.RecursosHora[j].Porcentaje;
                    TotalHoras += this.RecursosHora[j].Horas;
                    TotalTarifa += this.RecursosHora[j].tarifaHora;
                }
            }
            this.RecursosHoraTotal.push({ Cargo: this.listaRecursos[i].Cargo, Total: Total, TotalHoras: TotalHoras, TotalTarifa: TotalTarifa, Especialidad: this.listaRecursos[i].Especialidad })
            Total = 0;
            TotalHoras = 0;
            TotalTarifa = 0;
        }

        for (let i = 0; i < this.matrizGeneral.length; i++) {
            for (let j = 0; j < this.RecursosHora.length; j++) {
                if (this.matrizGeneral[i].sprint === this.RecursosHora[j].Sprint && this.matrizGeneral[i].version.version === this.RecursosHora[j].Version) {
                    costoSprint += this.RecursosHora[j].tarifaHora;
                }

                if (this.matrizGeneral[i].version.version === this.RecursosHora[j].Version) {
                    costoVersion += this.RecursosHora[j].tarifaHora;
                }

            }
            this.costoTotalSprint.push({ Version: this.matrizGeneral[i].version.version, Sprint: this.matrizGeneral[i].sprint, Costo: costoSprint, CostoVersion: costoVersion });
            costoSprint = 0;
            costoVersion = 0;

            this.totalPlaneacion += this.costoTotalSprint[i].Costo;
        }
    }

    calcularTotalVersion(v: string) {

        for (let i = 0; i < this.costoTotalSprint.length; i++) {
            if (this.costoTotalSprint[i].Version === v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()) {
                return this.costoTotalSprint[i].CostoVersion;
            }

        }
    }

    PorcentajeSprint() {
        let porcentaje: number = 0;
        this.SprintPorcentaje.length = 0;

        for (let i = 0; i < this.matrizGeneral.length; i++) {
            for (let j = 0; j < this.dataSourceAsignacionRecursoBeta.length; j++) {
                if (this.matrizGeneral[i].sprint === this.dataSourceAsignacionRecursoBeta[j].Version.sprint && this.matrizGeneral[i].version.version === this.dataSourceAsignacionRecursoBeta[j].Version.version.version) {
                    porcentaje += this.dataSourceAsignacionRecursoBeta[j].Porcentaje;
                }
            }

            this.SprintPorcentaje.push({ version: this.matrizGeneral[i].version.version, sprint: this.matrizGeneral[i].sprint, porcentaje: porcentaje / 100 });
            porcentaje = 0;

        }
    }

    openXlModal2(content: TemplateRef<any>, matriz_General: any) {
        this.modalService.open(content, { size: 'xl', backdrop: 'static', keyboard: false }).result.then((result) => {
            console.log("Modal closed" + result);
            let cantidadRecursos = 0;
            this.dataSourceAsignacionRecursoBeta.forEach(element => {
                if (matriz_General.sprint === element.Version.sprint && matriz_General.version.id === element.Version.version.id){
                    cantidadRecursos += 1;
                }
            })
            matriz_General.recursosAsignados = cantidadRecursos;
        }).catch((res) => { });
        this.infoVersion = matriz_General,
        this.version_recurso = matriz_General.sprint;
        this.dias_sprint = matriz_General.duracionDiasSprint;
        this.version_matriz = matriz_General.version.id;
    }

    getParametriaRecursos() {
        this.parametriaRecursosMatrizTiempoService.getParametriaRecursos().subscribe(data => {
            this.tiposRecursos = data;
            this.tiposRecursos.sort((a, b) => a.perfil.perfil.localeCompare(b.perfil.perfil));
        }, error => console.log(error));
    }

    getListEspecialidades() {
        this.parametriaRecursosMatrizTiempoService.getEspecialidadRecursos().subscribe(data => {
            this.especialidades = data;
            this.especialidades.sort((a, b) => a.especialidad.localeCompare(b.especialidad))
        }, error => console.log(error));
    }

    agregarRecursoBeta() {
        const nuevaFila: any = {
            Especialidad: undefined,
            Perfil: undefined,
            Porcentaje: null,
            Editar: true,
            Eliminar: false,
            Version: this.infoVersion
        };
        this.tituloEspecialidad = "Seleccionar opción";
        this.tituloPerfil = "Seleccionar opción";
        this.rowRecursoSave = true;
        this.dataSourceAsignacionRecursoBeta.push(nuevaFila);
    }

    deleteRecursoVacio() {
        for (let i = 0; i < this.dataSourceAsignacionRecursoBeta.length; i++) {
            if (this.dataSourceAsignacionRecursoBeta[i].Especialidad === undefined ||
                this.dataSourceAsignacionRecursoBeta[i].Perfil === undefined ||
                this.dataSourceAsignacionRecursoBeta[i].Porcentaje === 0 || this.dataSourceAsignacionRecursoBeta[i].Porcentaje === '' || this.dataSourceAsignacionRecursoBeta[i].Porcentaje === null) {

                this.dataSourceAsignacionRecursoBeta.splice(i, 1);
                this.rowRecursoSave = !this.rowRecursoSave;
            }
        }
    }

    toggleEditRecurso(index: number) {

        // Validación Campos Obligatorios para Guardar

        if (this.dataSourceAsignacionRecursoBeta[index].Editar) {
            if (this.dataSourceAsignacionRecursoBeta[index].Especialidad != undefined && this.dataSourceAsignacionRecursoBeta[index].Perfil != undefined) {
                if (this.dataSourceAsignacionRecursoBeta[index].Porcentaje != 0 && this.dataSourceAsignacionRecursoBeta[index].Porcentaje != null) {
                    this.dataSourceAsignacionRecursoBeta[index].Editar = !this.dataSourceAsignacionRecursoBeta[index].Editar;
                    this.rowRecursoSave = !this.rowRecursoSave;
                    this.tituloEspecialidad = "Seleccionar opción";
                    this.tituloPerfil = "Seleccionar opción";
                }

            }
        } else if (!this.dataSourceAsignacionRecursoBeta[index].Editar) {

            // Validación botón Editar
            this.tituloEspecialidad = this.dataSourceAsignacionRecursoBeta[index].Especialidad.especialidad;
            this.tituloPerfil = this.dataSourceAsignacionRecursoBeta[index].Perfil.perfil.perfil;
            this.dataSourceAsignacionRecursoBeta[index].Editar = !this.dataSourceAsignacionRecursoBeta[index].Editar;
            this.rowRecursoSave = !this.rowRecursoSave;
        }

    }

    saveRecursoAsignado() {
        for (const element of this.dataSourceAsignacionRecursoBeta) {
            this.Recursos.push(
                {   
                    sprint: element.Version.sprint,
                    perfil: element.Perfil.perfil.perfil,
                    especialidad: element.Especialidad.especialidad, 
                    idEspecialidad: element.Especialidad.id,
                    horasLaborales: this.parametriaTiempoList.numeroHoras, 
                    tarifaHora: element.Perfil.tarifaHora,
                    tarifaMensual: element.Perfil.tarifaMensual,
                    porcentajesAsignados: element.Porcentaje,
                    version: element.Version.version
                });
        }
    }


    activarEspecialidad() {
        this.selectEspecialidad = !this.selectEspecialidad;
    }

    changeEspecialidad(esp: any, index: number) {
        this.dataSourceAsignacionRecursoBeta[index].Especialidad = esp;
        this.tituloEspecialidad = this.dataSourceAsignacionRecursoBeta[index].Especialidad.especialidad;
        this.selectEspecialidad = !this.selectEspecialidad;

        this.dataSourceAsignacionRecursoBeta[index].Perfil = undefined;
        this.tituloPerfil = "Seleccionar opción";
    }

    activarPerfil() {
        this.selectPerfil = !this.selectPerfil;
    }

    changePerfil(car: any, index: number) {
        this.dataSourceAsignacionRecursoBeta[index].Perfil = car;
        this.tituloPerfil = this.dataSourceAsignacionRecursoBeta[index].Perfil.perfil.perfil;
        this.selectPerfil = !this.selectPerfil;
    }

    redondearTiempo(porcentaje: number, itemMatrizGeneral: number, numHoras: number) {
        return Math.ceil(itemMatrizGeneral * numHoras * porcentaje)
    }
}

export class GeneracionMatrizTiempo {
    id: number;
    version: number;
    sprints: number;
    duracionDiasSprints: number;
    totalHorasSprints: number;
    totalHorasRecursoSprints: number;
    recursoAsignadoSprints: number;
}
