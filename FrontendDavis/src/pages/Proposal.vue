<template>
  <div class="proposal-page">
    <!-- Header Logo -->
    <img :src="logoImg" alt="Logo" class="proposal-header-logo" />
    <div class="proposal-main-content">
      <p align="right"><b>CO/DND/WTS/0454165</b></p>
      <p align="right"><b>28 April, 2025</b></p>
      <p><b>John Makau</b></p>
      <p>Dear Sir/Madam,</p>
      <p align="center"><u><b>PROPOSAL FOR SUPPLY AND INSTALLATION OF WATER TREATMENT PLANT</b></u></p>
      <p>Following the inquiry regarding the above, Davis and Shirtliff wish to present a proposal, terms, and conditions for a solution to treat the client’s borehole water for domestic drinking and use in the laboratory.</p>
      <ol>
        <li><b>CUSTOMER REQUIREMENTS</b></li>
      </ol>
      <p>Based on the requirement Davis and Shirtliff have provided a water treatment system that can treat <b>250 litres/hr</b> for domestic use.</p>
      <ol>
        <ol>
          <li><b>SITE CONDITIONS</b></li>
        </ol>
      </ol>
      <p>The water analysis report from Davis & Shirtliff Laboratory (Lab Sample ID: <b>10/24/RO/2376</b>, dated 10th October, 2024) indicates that all tested parameters were within acceptable limits.</p>
      <!-- Example Parameter Table -->
      <table class="proposal-table">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Unit</th>
            <th>Result</th>
            <th>WHO Standard</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>pH</td><td>-</td><td>6.13</td><td>6.5-8.5</td>
          </tr>
          <!-- Add more rows as needed -->
        </tbody>
      </table>
      <ol start="2">
        <li><b>PROPOSED SOLUTION</b></li>
      </ol>
      <p>Davis & Shirtliff proposes a treatment plant designed to provide a net flow rate of <b>0.25 m³/hr</b> as requested by the client.</p>
      <p>Below are the unit treatment processes involved.</p>
      <ul>
        <li><b>Chlorination and oxidation</b></li>
        <li><b>Filtration</b> - Removal of suspended matter, turbidity, and colour</li>
        <li><b>Reverse Osmosis</b> - Removal of Dissolved salts</li>
        <li><b>Post disinfection</b> - Chlorination</li>
      </ul>
      <p><b>Proposed Treatment Layout</b></p>
      <img :src="layoutImg" alt="Treatment Layout" class="proposal-diagram-img" />
      <p><b>Proposed Treatment Process</b></p>
      <ul>
        <li>The incoming water from the borehole shall be dosed with pH plus to adjust the pH to the acceptable levels and chlorine to oxidize and precipitate any dissolved iron and manganese as it goes into an aeration tank (Client’s Scope).</li>
        <li>In the aeration tank, dissolved iron and manganese are further oxidized through the injection of air into the water through the air distribution system.</li>
        <li>To prevent scaling of the RO membranes, it will be important to dose an antiscalant into the water before the water goes into the RO. Genesys antiscalant will, therefore, be continuously added to the system before the RO.</li>
        <li>The treated water will be dosed with a chlorine for disinfection before storage (Client's scope).</li>
      </ul>
      <p><b>EQUIPMENT</b></p>
      <ul>
        <li><b>Dayliff Filters</b> – <a href="https://uganda.davisandshirtliff.com/water-treatment/product/pentair-pxd-industrial-water-filters">Dayliff PXD Industrial media filters</a> are specifically designed for filtration applications where higher levels of operating pressure and reliability are demanded. The filter will be charged with glass media of different grades for sediment removal.</li>
        <li><b>Reverse Osmosis Unit</b> – <a href="https://www.davisandshirtliff.com/products-and-solutions/product/bro4">Reverse Osmosis (DRO4)</a> is a process in which purified water (permeate) is produced from the feed water via the rejection of all organic and inorganic constituents by a semi-permeable membrane system. The RO system separates the incoming feed stream into two effluent streams: permeate (treated water) and concentrate (reject water).</li>
      </ul>
      <img :src="equipImg" alt="Equipment" class="proposal-equip-img" />
      <p><b>INSTALLATION</b></p>
      <table class="proposal-table">
        <tr>
          <td><b>Davis & Shirtliff Ltd Scope</b></td>
          <td><b>The Client Scope</b></td>
        </tr>
        <tr>
          <td>
            <ul>
              <li>Fabrication and assembly of equipment.</li>
              <!-- Add more as needed -->
            </ul>
          </td>
          <td>
            <ul>
              <li>Provide a well-ventilated plant room.</li>
              <!-- Add more as needed -->
            </ul>
          </td>
        </tr>
      </table>
      <p><b>PRICING</b></p>
      <table class="proposal-table">
        <tr>
          <td>SUPPLY & INSTALLATION OF A WATER TREATMENT PLANT -250 LIT/HR</td>
          <td>1</td>
          <td>1,532,550</td>
        </tr>
        <!-- Add more rows as needed -->
      </table>
      <img :src="processImg" alt="Process Diagram" class="proposal-diagram-img" />
      <!-- Add bank details, terms, and any additional sections as needed -->
    </div>
  </div>
</template>

<script setup>
// You can later replace hardcoded values with real data from your backend or Vue state
import logoImg from '../assets/logo.png';
import layoutImg from '../assets/1MzDRuhrCCkofvxHnwwqLDOc1qKIe_Jpp_html_1d0378a.png';
import equipImg from '../assets/1MzDRuhrCCkofvxHnwwqLDOc1qKIe_Jpp_html_6ddf9c53.png';
import processImg from '../assets/1MzDRuhrCCkofvxHnwwqLDOc1qKIe_Jpp_html_8933e44b.jpg';
</script>

<style scoped>
.proposal-page {
  max-width: 900px;
  margin: 2.5rem auto;
  padding: 2.5rem 2rem 2rem 2rem;
  background: #f7fafd;
  border-radius: 14px;
  box-shadow: 0 6px 32px rgba(37,99,235,0.09);
  border: 1.5px solid #2563eb;
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  color: #22314a;
}
.proposal-header-logo {
  width: 220px;
  margin: 0 auto 1.5rem auto;
  display: block;
}
.proposal-main-content {
  position: relative;
  z-index: 1;
}
.proposal-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.1rem 0;
  background: #fff;
  border: 1px solid #c3dafe;
}
.proposal-table th, .proposal-table td {
  border: 1px solid #c3dafe;
  padding: 8px 10px;
  text-align: left;
}
.proposal-table th {
  background: #eaf2fd;
}
.proposal-diagram-img {
  display: block;
  margin: 24px auto 16px auto;
  max-width: 80%;
  height: auto;
}
.proposal-equip-img {
  display: block;
  margin: 16px auto;
  max-width: 40%;
  height: auto;
}
</style>
