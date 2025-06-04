// src/components/ui/form-field.tsx
import type { ReactNode } from "react";
import { Label } from "./label" // Asegúrate de que la ruta sea correcta

interface FormFieldProps {
  htmlFor: string // ID del input/control asociado
  label: string
  children: ReactNode // El componente de entrada (Input, Select, Textarea, etc.)
  errorMessage?: string // Mensaje de error a mostrar
  className?: string
}

export function FormField({ htmlFor, label, children, errorMessage, className }: FormFieldProps) {
  return (
    <div className={`mb-4 ${className || ""}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {errorMessage && (
        <p className="text-sm text-red-600 mt-1" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  )
}

// Ejemplo de uso con los componentes mejorados:
/*
import { FormField } from './form-field';
import { Input } from './input';
import { Select } from './select';
import { Textarea } from './textarea';
import { Checkbox } from './checkbox';
import { RadioGroup, RadioGroupItem } from './radio-group';

function MyForm() {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [notes, setNotes] = useState('');
  const [notesError, setNotesError] = useState('');
  const [country, setCountry] = useState('');
  const [countryError, setCountryError] = useState('');
  const [agree, setAgree] = useState(false);
  const [gender, setGender] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    let valid = true;

    if (!name) {
      setNameError('El nombre es obligatorio.');
      valid = false;
    } else {
      setNameError('');
    }

    if (!notes) {
      setNotesError('Las notas son obligatorias.');
      valid = false;
    } else {
      setNotesError('');
    }

    if (!country) {
      setCountryError('Debe seleccionar un país.');
      valid = false;
    } else {
      setCountryError('');
    }

    if (valid) {
      console.log('Formulario válido', { name, notes, country, agree, gender });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">Formulario de Paciente</h2>

      <FormField htmlFor="patient-name" label="Nombre del Paciente" errorMessage={nameError}>
        <Input
          id="patient-name"
          type="text"
          placeholder="Ej: Ana María López"
          value={name}
          onChange={(e) => setName(e.target.value)}
          isInvalid={!!nameError} // Pasa el estado de error al Input
        />
      </FormField>

      <FormField htmlFor="patient-notes" label="Notas Clínicas" errorMessage={notesError}>
        <Textarea
          id="patient-notes"
          placeholder="Ingrese las observaciones del paciente..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          isInvalid={!!notesError} // Pasa el estado de error al Textarea
        />
      </FormField>

      <FormField htmlFor="patient-country" label="País de Origen" errorMessage={countryError}>
        <Select
          id="patient-country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          isInvalid={!!countryError} // Pasa el estado de error al Select
        >
          <option value="">Seleccione un país</option>
          <option value="AR">Argentina</option>
          <option value="MX">México</option>
          <option value="ES">España</option>
        </Select>
      </FormField>

      <div className="mb-4">
        <Label>Género</Label>
        <RadioGroup name="gender" value={gender} onValueChange={setGender}>
          <RadioGroupItem value="male">Masculino</RadioGroupItem>
          <RadioGroupItem value="female">Femenino</RadioGroupItem>
          <RadioGroupItem value="prefer-not-say">Prefiero no decir</RadioGroupItem>
        </RadioGroup>
      </div>

      <div className="mb-4 flex items-center space-x-2">
        <Checkbox
          id="terms-agree"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
        />
        <Label htmlFor="terms-agree">Acepto los términos y condiciones</Label>
      </div>

      <Button type="submit">Enviar Formulario</Button>
    </form>
  );
}
*/