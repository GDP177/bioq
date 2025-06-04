// src/pages/examenes/RegistroExamenes.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Autocomplete,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Save as SaveIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { 
  Paciente, 
  Medico, 
  Analisis, 
  Examen, 
  ExamenSeleccionado,
  SelectOption 
} from '../../types';
import { 
  pacienteService, 
  medicoService, 
  analisisService, 
  examenService,
  realizarExamenService 
} from '../../services/api';

// Esquema de validación
const schema = yup.object().shape({
  paciente: yup.object().nullable().required('Debe seleccionar un paciente'),
  medico_id: yup.number().required('Debe seleccionar un médico'),
  analisis_id: yup.number().when('examenes', {
    is: (examenes: ExamenSeleccionado[]) => examenes.length === 0,
    then: (schema) => schema.required('Debe seleccionar un análisis'),
    otherwise: (schema) => schema.notRequired(),
  }),
  examen_id: yup.number().when('examenes', {
    is: (examenes: ExamenSeleccionado[]) => examenes.length === 0,
    then: (schema) => schema.required('Debe seleccionar un examen'),
    otherwise: (schema) => schema.notRequired(),
  }),
});

interface FormData {
  paciente: Paciente | null;
  medico_id: number | '';
  analisis_id: number | '';
  examen_id: number | '';
}

const RegistroExamenes: React.FC = () => {
  // Estados
  const [pacienteOptions, setPacienteOptions] = useState<Paciente[]>([]);
  const [medicoOptions, setMedicoOptions] = useState<SelectOption[]>([]);
  const [analisisOptions, setAnalisisOptions] = useState<SelectOption[]>([]);
  const [examenOptions, setExamenOptions] = useState<SelectOption[]>([]);
  const [examenesSeleccionados, setExamenesSeleccionados] = useState<ExamenSeleccionado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form
  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      paciente: null,
      medico_id: '',
      analisis_id: '',
      examen_id: '',
    }
  });

  const watchAnalisisId = watch('analisis_id');

  // Efectos
  useEffect(() => {
    cargarMedicos();
    cargarAnalisis();
  }, []);

  useEffect(() => {
    if (watchAnalisisId) {
      cargarExamenes(Number(watchAnalisisId));
    } else {
      setExamenOptions([]);
    }
  }, [watchAnalisisId]);

  // Funciones de carga de datos
  const cargarMedicos = async () => {
    try {
      const medicos = await medicoService.listarSelect();
      setMedicoOptions(medicos);
    } catch (error) {
      console.error('Error cargando médicos:', error);
      setError('Error al cargar la lista de médicos');
    }
  };

  const cargarAnalisis = async () => {
    try {
      const analisis = await analisisService.listarSelect();
      setAnalisisOptions(analisis);
    } catch (error) {
      console.error('Error cargando análisis:', error);
      setError('Error al cargar la lista de análisis');
    }
  };

  const cargarExamenes = async (analisisId: number) => {
    try {
      const examenes = await examenService.listarPorAnalisis(analisisId);
      setExamenOptions(examenes);
    } catch (error) {
      console.error('Error cargando exámenes:', error);
      setError('Error al cargar la lista de exámenes');
    }
  };

  const buscarPacientes = async (inputValue: string) => {
    if (inputValue.length < 2) {
      setPacienteOptions([]);
      return;
    }

    try {
      const pacientes = await pacienteService.buscar(inputValue);
      setPacienteOptions(pacientes);
    } catch (error) {
      console.error('Error buscando pacientes:', error);
      setError('Error al buscar pacientes');
    }
  };

  // Funciones de manejo de exámenes
  const agregarExamen = () => {
    const analisisId = Number(watch('analisis_id'));
    const examenId = Number(watch('examen_id'));

    if (!analisisId || !examenId) {
      setError('Debe seleccionar un análisis y un examen');
      return;
    }

    // Verificar si el examen ya está agregado
    if (examenesSeleccionados.some(e => e.examen_id === examenId)) {
      setError('Este examen ya ha sido agregado');
      return;
    }

    const analisisNombre = analisisOptions.find(a => a.value === analisisId)?.label || '';
    const examenNombre = examenOptions.find(e => e.value === examenId)?.label || '';

    const nuevoExamen: ExamenSeleccionado = {
      examen_id: examenId,
      examen_nombre: examenNombre,
      analisis_id: analisisId,
      analisis_nombre: analisisNombre,
    };

    setExamenesSeleccionados([...examenesSeleccionados, nuevoExamen]);
    setValue('analisis_id', '');
    setValue('examen_id', '');
    setError(null);
  };

  const removerExamen = (examenId: number) => {
    setExamenesSeleccionados(examenesSeleccionados.filter(e => e.examen_id !== examenId));
  };

  // Función de envío
  const onSubmit = async (data: FormData) => {
    if (!data.paciente) {
      setError('Debe seleccionar un paciente');
      return;
    }

    if (examenesSeleccionados.length === 0) {
      setError('Debe agregar al menos un examen');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        paciente_id: data.paciente.paciente_id,
        medico_id: Number(data.medico_id),
        examenes: examenesSeleccionados.map(e => ({
          examen_id: e.examen_id,
          analisis_id: e.analisis_id,
        })),
      };

      const response = await realizarExamenService.registrar(payload);

      if (response.success) {
        setSuccess('Exámenes registrados correctamente');
        reset();
        setExamenesSeleccionados([]);
        setPacienteOptions([]);
      } else {
        setError(response.message || 'Error al registrar los exámenes');
      }
    } catch (error) {
      console.error('Error registrando exámenes:', error);
      setError('Error al registrar los exámenes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardHeader title="Registro de Exámenes" />
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Búsqueda de paciente */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="paciente"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={pacienteOptions}
                      getOptionLabel={(option) => 
                        `${option.paciente_apellido_paterno} ${option.paciente_apellido_materno} ${option.paciente_nombres} - DNI: ${option.paciente_dni}`
                      }
                      onInputChange={(_, newInputValue) => {
                        buscarPacientes(newInputValue);
                      }}
                      onChange={(_, newValue) => {
                        field.onChange(newValue);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Buscar Paciente"
                          placeholder="Ingrese DNI, nombre o apellido"
                          error={!!errors.paciente}
                          helperText={errors.paciente?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              {/* Selección de médico */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="medico_id"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.medico_id}>
                      <InputLabel>Médico que indica</InputLabel>
                      <Select
                        {...field}
                        label="Médico que indica"
                      >
                        <MenuItem value="">Seleccione un médico</MenuItem>
                        {medicoOptions.map((medico) => (
                          <MenuItem key={medico.value} value={medico.value}>
                            {medico.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Mostrar datos del paciente si está seleccionado */}
              {watch('paciente') && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardHeader title="Datos del Paciente" />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                          <TextField
                            label="DNI"
                            value={watch('paciente')?.paciente_dni || ''}
                            disabled
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} md={9}>
                          <TextField
                            label="Nombre Completo"
                            value={watch('paciente') ? 
                              `${watch('paciente')!.paciente_apellido_paterno} ${watch('paciente')!.paciente_apellido_materno} ${watch('paciente')!.paciente_nombres}` 
                              : ''
                            }
                            disabled
                            fullWidth
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Selección de análisis y exámenes */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardHeader title="Selección de Exámenes" />
                  <CardContent>
                    <Grid container spacing={2} alignItems="end">
                      <Grid item xs={12} md={4}>
                        <Controller
                          name="analisis_id"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>Análisis</InputLabel>
                              <Select
                                {...field}
                                label="Análisis"
                              >
                                <MenuItem value="">Seleccione un análisis</MenuItem>
                                {analisisOptions.map((analisis) => (
                                  <MenuItem key={analisis.value} value={analisis.value}>
                                    {analisis.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller
                          name="examen_id"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth disabled={!watchAnalisisId}>
                              <InputLabel>Examen</InputLabel>
                              <Select
                                {...field}
                                label="Examen"
                              >
                                <MenuItem value="">Seleccione un examen</MenuItem>
                                {examenOptions.map((examen) => (
                                  <MenuItem key={examen.value} value={examen.value}>
                                    {examen.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={agregarExamen}
                          disabled={!watch('analisis_id') || !watch('examen_id')}
                          fullWidth
                        >
                          Agregar
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Tabla de exámenes seleccionados */}
              {examenesSeleccionados.length > 0 && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardHeader title="Exámenes Seleccionados" />
                    <CardContent>
                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Examen</TableCell>
                              <TableCell>Análisis</TableCell>
                              <TableCell align="center">Acción</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {examenesSeleccionados.map((examen) => (
                              <TableRow key={examen.examen_id}>
                                <TableCell>{examen.examen_nombre}</TableCell>
                                <TableCell>{examen.analisis_nombre}</TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    color="error"
                                    onClick={() => removerExamen(examen.examen_id)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                          disabled={loading}
                        >
                          {loading ? 'Registrando...' : 'Registrar Exámenes'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Mensajes de error y éxito */}
              {error && (
                <Grid item xs={12}>
                  <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                  </Alert>
                </Grid>
              )}

              {success && (
                <Grid item xs={12}>
                  <Alert severity="success" onClose={() => setSuccess(null)}>
                    {success}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegistroExamenes;