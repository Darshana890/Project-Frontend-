document.addEventListener('DOMContentLoaded', () => {
    const autocompleteInput = document.getElementById('autocomplete-input');
    const suggestionsList = document.getElementById('suggestions');
    const doctorListContainer = document.getElementById('doctor-list');
    const consultationRadios = document.querySelectorAll('input[name="consultationType"]');
    const specialtyCheckboxes = document.querySelectorAll('input[type="checkbox"][value]');
    const sortRadios = document.querySelectorAll('input[name="sortBy"]');

    let allDoctors = [];
    let filteredDoctors = [];

    // Function to fetch doctor data from the API
    async function fetchDoctors() {
        try {
            const response = await fetch('https://srijandubey.github.io/campus-api-mock/SRM-C1-25.json');
            const data = await response.json();
            allDoctors = data;
            applyFiltersAndRender();
        } catch (error) {
            console.error('Error fetching data:', error);
            doctorListContainer.innerHTML = '<p>Failed to load doctors.</p>';
        }
    }

    // Function to render the list of doctors
    function renderDoctors(doctors) {
        doctorListContainer.innerHTML = '';
        if (doctors.length === 0) {
            doctorListContainer.innerHTML = '<p>No doctors found matching your criteria.</p>';
            return;
        }

        doctors.forEach(doctor => {
            const card = document.createElement('div');
            card.classList.add('doctor-card');
            card.setAttribute('data-testid', 'doctor-card');

            const name = document.createElement('div');
            name.classList.add('doctor-name');
            name.textContent = doctor.name;
            name.setAttribute('data-testid', 'doctor-name');

            const specialty = document.createElement('div');
            specialty.classList.add('doctor-specialty');
            specialty.textContent = Array.isArray(doctor.speciality) ? doctor.speciality.join(', ') : doctor.speciality;
            specialty.setAttribute('data-testid', 'doctor-specialty');

            const experience = document.createElement('div');
            experience.classList.add('doctor-experience');
            experience.textContent = `${doctor.experience} years experience`;
            experience.setAttribute('data-testid', 'doctor-experience');

            const fee = document.createElement('div');
            fee.classList.add('doctor-fee');
            fee.textContent = `₹${doctor.fees}`;
            fee.setAttribute('data-testid', 'doctor-fee');

            card.appendChild(name);
            card.appendChild(specialty);
            card.appendChild(experience);
            card.appendChild(fee);
            doctorListContainer.appendChild(card);
        });
    }

    // Function to filter doctors by name for autocomplete
    function filterByName(searchText) {
        if (!searchText) {
            return [];
        }
        const lowerCaseSearchText = searchText.toLowerCase();
        return allDoctors
            .filter(doctor => doctor.name.toLowerCase().includes(lowerCaseSearchText))
            .slice(0, 3);
    }

    // Function to display autocomplete suggestions
    function displaySuggestions(suggestions) {
        suggestionsList.innerHTML = '';
        if (suggestions.length > 0) {
            suggestions.forEach(suggestion => {
                const listItem = document.createElement('li');
                listItem.classList.add('suggestion-item');
                listItem.setAttribute('data-testid', 'suggestion-item');
                listItem.textContent = suggestion.name;
                listItem.addEventListener('click', () => {
                    autocompleteInput.value = suggestion.name;
                    suggestionsList.innerHTML = '';
                    applyFiltersAndRender({ name: suggestion.name });
                });
                suggestionsList.appendChild(listItem);
            });
        }
    }

    // Event listener for autocomplete input
    autocompleteInput.addEventListener('input', () => {
        const searchText = autocompleteInput.value.trim();
        const suggestions = filterByName(searchText);
        displaySuggestions(suggestions);
    });

    // Event listener for Enter key in autocomplete input
    autocompleteInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const searchText = autocompleteInput.value.trim();
            suggestionsList.innerHTML = '';
            applyFiltersAndRender({ name: searchText });
        }
    });

    // Function to get current filters from the UI
    function getCurrentFilters() {
        const filters = {};
        const consultationType = Array.from(consultationRadios).find(radio => radio.checked)?.value;
        if (consultationType) {
            filters.consultationType = consultationType;
        }

        const selectedSpecialties = Array.from(specialtyCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
        if (selectedSpecialties.length > 0) {
            filters.specialties = selectedSpecialties;
        }

        const sortBy = Array.from(sortRadios).find(radio => radio.checked)?.value;
        if (sortBy) {
            filters.sortBy = sortBy;
        }
        return filters;
    }

    // Function to filter the doctor list based on selected criteria
    function filterDoctors(doctors, filters) {
        let filtered = [...doctors]; // Start with a copy of the doctors

        if (filters.name) {
            const nameLower = filters.name.toLowerCase();
            filtered = filtered.filter(doctor => doctor.name.toLowerCase().includes(nameLower));
        }

        if (filters.consultationType) {
            filtered = filtered.filter(doctor => doctor.mode === filters.consultationType);
        }

        if (filters.specialties) {
            filtered = filtered.filter(doctor => {
                if (Array.isArray(doctor.speciality)) {
                    return filters.specialties.some(specialty => doctor.speciality.includes(specialty));
                }
                return filters.specialties.includes(doctor.speciality);
            });
        }

        return filtered;
    }

    function sortDoctors(doctors, sortBy) {
        let sorted = [...doctors];
        if (sortBy === 'fees') {
            sorted.sort((a, b) => a.fees - b.fees);
        } else if (sortBy === 'experience') {
            sorted.sort((a, b) => b.experience - a.experience);
        }
        return sorted;
    }

    function applyFiltersAndRender(nameFilter = {}) { // added nameFilter
        const filters = getCurrentFilters();
        const updatedFilters = { ...filters, ...nameFilter }; // Combine filters
        filteredDoctors = filterDoctors(allDoctors, updatedFilters);

        if (updatedFilters.sortBy) { // use updatedFilters
            filteredDoctors = sortDoctors(filteredDoctors, updatedFilters.sortBy);
        }
        renderDoctors(filteredDoctors);
        updateURL(updatedFilters); // use updatedFilters
    }

    function updateURL(filters) {
        const url = new URL(window.location.href);
        url.search = ''; // Clear existing query parameters

        for (const key in filters) {
            if (key === 'specialties') {
                filters[key].forEach(specialty => {
                    url.searchParams.append('specialty', specialty); // Changed to 'specialty'
                });
            } else {
                url.searchParams.set(key, filters[key]);
            }
        }
        window.history.pushState({}, '', url);
    }

    function readURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const filters = {};

        if (urlParams.has('consultationType')) {
            filters.consultationType = urlParams.get('consultationType');
            const radio = document.querySelector(`input[name="consultationType"][value="${filters.consultationType}"]`);
            if (radio) {
                radio.checked = true;
            }
        }

        const specialties = urlParams.getAll('specialty'); // Get all 'specialty'
        if (specialties.length > 0) {
            filters.specialties = specialties;
            specialties.forEach(specialty => {
                const checkbox = document.querySelector(`input[type="checkbox"][value="${specialty}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }

        if (urlParams.has('sortBy')) {
            filters.sortBy = urlParams.get('sortBy');
            const radio = document.querySelector(`input[name="sortBy"][value="${filters.sortBy}"]`);
            if (radio) {
                radio.checked = true;
            }
        }
        return filters;
    }

    // Event listeners for filters
    consultationRadios.forEach(radio => {
        radio.addEventListener('change', applyFiltersAndRender);
    });

    specialtyCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', applyFiltersAndRender);
    });

    sortRadios.forEach(radio => {
        radio.addEventListener('change', applyFiltersAndRender);
    });

    // Initial setup: fetch data, read URL, apply filters, render
    fetchDoctors();
    const initialFilters = readURL();
    applyFiltersAndRender(initialFilters); // Pass initial filters

});
