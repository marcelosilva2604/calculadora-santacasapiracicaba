from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.get_json()
    
    # Processando os dados recebidos do frontend
    inputs = data.get('inputs', {})
    outputs = data.get('outputs', {})
    patient_info = data.get('patientInfo', {})
    measurements = data.get('measurements', {})
    
    # Obter peso do paciente e período (12h ou 24h)
    patient_weight = float(patient_info.get('weight', 0))
    timeframe = int(data.get('timeframe', 12))
    
    # Verificar se o peso é válido
    if patient_weight <= 0:
        return jsonify({
            "error": "O peso do paciente deve ser maior que zero para calcular o balanço hídrico."
        }), 400
    
    # Cálculos de entradas individuais
    diet = float(inputs.get('diet', 0))
    serum = float(inputs.get('serum', 0))
    medication = float(inputs.get('medication', 0))
    
    # Calcular valores por kg
    diet_per_kg = diet / patient_weight if patient_weight > 0 else 0
    serum_per_kg = serum / patient_weight if patient_weight > 0 else 0
    medication_per_kg = medication / patient_weight if patient_weight > 0 else 0
    
    # Cálculos de saídas
    diuresis = float(outputs.get('diuresis', 0))
    gastric_residue = float(outputs.get('gastricResidue', 0))
    emesis = float(outputs.get('emesis', 0))  # Em vezes, não em ml
    evacuations = float(outputs.get('evacuations', 0))  # Em vezes, não em ml
    
    # Calcular valores por kg
    gastric_residue_per_kg = gastric_residue / patient_weight if patient_weight > 0 else 0
    
    # Cálculos totais de entrada e saída em ml
    total_input = diet + serum + medication
    total_output = diuresis + gastric_residue
    
    # Cálculo do balanço simples em ml
    balance = total_input - total_output
    
    # Cálculos avançados
    # 1. Oferta hídrica (entradas / peso)
    liquid_intake = total_input / patient_weight if patient_weight > 0 else 0
    
    # 2. Diurese em ml/kg/h
    diuresis_per_kg_hour = 0
    if patient_weight > 0 and timeframe > 0:
        diuresis_per_kg_hour = diuresis / timeframe / patient_weight
    
    # 3. Balanço hídrico por peso
    balance_per_kg = balance / patient_weight if patient_weight > 0 else 0
    
    # 4. Débito hídrico por peso
    output_per_kg = total_output / patient_weight if patient_weight > 0 else 0
    
    # Determinando o status do balanço
    if balance > 0:
        status = "positivo"
    elif balance < 0:
        status = "negativo"
    else:
        status = "neutro"
    
    # Criando o resultado detalhado
    result = {
        # Entradas
        "diet": round(diet, 2),
        "diet_per_kg": round(diet_per_kg, 2),
        "serum": round(serum, 2),
        "serum_per_kg": round(serum_per_kg, 2),
        "medication": round(medication, 2),
        "medication_per_kg": round(medication_per_kg, 2),
        "total_input": round(total_input, 2),
        "liquid_intake": round(liquid_intake, 2),
        
        # Saídas
        "diuresis": round(diuresis, 2),
        "diuresis_per_kg_hour": round(diuresis_per_kg_hour, 2),
        "gastric_residue": round(gastric_residue, 2),
        "gastric_residue_per_kg": round(gastric_residue_per_kg, 2),
        "emesis_count": round(emesis),
        "evacuations_count": round(evacuations),
        "total_output": round(total_output, 2),
        "output_per_kg": round(output_per_kg, 2),
        
        # Balanço
        "balance": round(balance, 2),
        "balance_per_kg": round(balance_per_kg, 2),
        "status": status,
        
        # Dados do paciente e medições
        "patient": {
            "name": patient_info.get('name', ''),
            "bed": patient_info.get('bed', ''),
            "weight": patient_weight,
            "timeframe": timeframe
        },
        "measurements": measurements
    }
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5001) 