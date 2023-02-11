'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    }  ${this.date.getDay()}
    `;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cyclyng extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    // km /h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const run1 = new Running([39, -12], 5.2, 25, 178);
const cycling1 = new Cyclyng([39, -12], 27, 95, 523);

// ////////////////////////////////
//  APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const btnReset = document.querySelector('.btn-reset');
const btnChange = document.querySelector('.btn-change');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workout = [];
  workout1;

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();
    // Attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    btnReset.addEventListener('click', this.reset);
    containerWorkouts.addEventListener('click', this.delete);
    containerWorkouts.addEventListener('click', this.edit.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    this.#workout.forEach(work => {
      this.renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    // empty inputs
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    e.preventDefault();

    // GET data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs need to be positive numbers');

      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // if workout cycling, create cyclig object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // Check if data valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs need to be positive numbers');

      workout = new Cyclyng([lat, lng], distance, duration, elevation);
    }
    // Add new object to workout array
    this.#workout.push(workout);
    console.log(this.#workout);

    // Render workout on map as marker
    this.renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    //  Render workout on list

    // Hide form + clear input fields
    this._hideForm();

    //Set local storage to all workout
    this._setLocalStorage();
  }

  renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWifth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <div class="btn btn-corner btn-delete"> <span class= btn-delete__cross>&times;</span></div>
      <div class="btn btn-corner btn-edit"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="btn-edit__pencil">
      <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
    </div>
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>`;

    if (workout.type === 'cycling')
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li> -->
    `;

    btnChange.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workout.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // Using public interface
    // workout.click();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workout));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workout = data;

    this.#workout.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
  delete(e) {
    const btnDeleteEl = e.target.closest('.btn-delete');

    if (!btnDeleteEl) return;
    const workoutEl = btnDeleteEl.parentElement;

    const workouts = JSON.parse(localStorage.getItem('workouts'));
    const filtered = workouts.filter(item => item.id !== workoutEl.dataset.id);
    localStorage.setItem('workouts', JSON.stringify(filtered));
    location.reload();
  }
  edit(e) {
    const btnEdit = e.target.closest('.btn-edit');
    const workouts = JSON.parse(localStorage.getItem('workouts'));
    console.log();
    if (btnEdit) {
      const workoutEl = btnEdit.parentElement;
      this.workout1 = workouts.findIndex(
        work => work.id === workoutEl.dataset.id
      );
      btnChange.classList.remove('hidden');
      console.log(e.target);
      console.log(this.workout1);

      // Find workout by id
      form.classList.remove('hidden');
      inputDistance.focus();
      inputDistance.value = this.#workout[this.workout1].distance;
      inputDuration.value = this.#workout[this.workout1].duration;
      if (this.#workout[this.workout1].type === 'running')
        inputCadence.value = this.#workout[this.workout1].cadence;

      if (this.#workout[this.workout1].type === 'cycling')
        inputElevation.value = this.#workout[this.workout1].elevationGain;
    }
    console.log(this.#workout[this.workout1]);
    if (e.target === btnChange) {
      this.#workout[this.workout1].distance = Number(inputDistance.value);
      this.#workout[this.workout1].duration = Number(inputDuration.value);
      if (this.#workout[this.workout1].type === 'running') {
        this.#workout[this.workout1].cadence = inputCadence.value;
        // this.#workout[this.workout1].calcPace();
      }
      if (this.#workout[this.workout1].type === 'cycling') {
        this.#workout[this.workout1].elevationGain = inputElevation.value;
        // this.#workout[this.workout1].calcSpeed();
      }
      console.log(this.#workout[this.workout1]);
      console.log(this.#workout);
      localStorage.removeItem('workouts');
      localStorage.setItem('workouts', JSON.stringify(this.#workout));
    }
  }

  // Make menu for change
  // Change data
  // Upload new data to local storage
}

const app = new App();
