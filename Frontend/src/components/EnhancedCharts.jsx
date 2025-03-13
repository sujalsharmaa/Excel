import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer,
  Treemap, ZAxis
} from 'recharts';
import html2canvas from 'html2canvas';

const EnhancedCharts = ({data}) => {
  const [activeChart, setActiveChart] = useState('bar');
  const categoryKey = data.length > 0 ? Object.keys(data[0])[0] : 'name';
  const valueKeys = data.length > 0 ? Object.keys(data[0]).slice(1) : [];

  const exportToPNG = () => {
    const chartElement = document.getElementById('chart-container');
    
    if (chartElement) {
      html2canvas(chartElement).then(canvas => {
        // Create a download link
        const link = document.createElement('a');
        link.download = `${activeChart}-chart.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  };
  

  const pieData = data.length > 0 ? data.map(entry => ({
    name: entry[categoryKey],
    value: entry[valueKeys[0]] || 0
  })) : [];
  


  



  const COLORS = [

  '#36A2EB', // Bright Sky Blue  
  '#FFCE56', // Soft Yellow  
  '#4BC0C0', // Turquoise  
  '#9966FF', // Purple  
  '#FF9F40', // Warm Orange  
  '#D72638', // Crimson Red  
  '#3E8914', // Deep Green  
  '#B23AEE', // Vivid Violet  
  '#F67280', // Pastel Pink  
  '#1E88E5', // Royal Blue  
  '#FDD835', // Golden Yellow  
  '#00A878', // Teal Green  
  '#FF6F61', // Coral  
  '#9C27B0', // Deep Purple  
  '#FFB400', // Bright Gold  
  '#0088FE', // Electric Blue  
  '#D4AF37', // Metallic Gold  
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#8884d8', '#82ca9d', '#ffc658', '#0088FE',
  '#FF5733', // Vivid Red-Orange  
  ];
  
  const renderChart = () => {
    switch(activeChart) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={categoryKey} />
            {valueKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} />
              
            ))}
            
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: 'none'
                }}
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              />

            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={categoryKey} tickLine={true} axisLine={true} />
              <YAxis tickLine={true} axisLine={true} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: 'none',
                  padding: '8px'
                }}
              />
              <Legend />
        
              {/* Gradient Definitions */}
              <defs>
                {valueKeys.map((key, index) => (
                  <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
        
              {valueKeys.map((key, index) => (
                <Line 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={3}
                  dot={{ stroke: COLORS[index % COLORS.length], strokeWidth: 2, r: 4, fill: 'white' }}
                  activeDot={{ r: 6, fill: COLORS[index % COLORS.length], stroke: 'white', strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
        
        
      case 'steppedLine':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={categoryKey} tickLine={true} axisLine={true} />
              <YAxis tickLine={true} axisLine={true} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: 'none',
                  padding: '8px'
                }}
              />
              <Legend />
        
              {/* Gradient Definitions */}
              <defs>
                {valueKeys.map((key, index) => (
                  <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
        
              {/* Step Line Chart */}
              {valueKeys.map((key, index) => (
                <Line
                  key={key}
                  type="stepAfter"
                  dataKey={key}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={3}
                  dot={{ 
                    stroke: COLORS[index % COLORS.length], 
                    strokeWidth: 2, 
                    r: 4, 
                    fill: 'white' 
                  }}
                  activeDot={{ 
                    r: 6, 
                    fill: COLORS[index % COLORS.length], 
                    stroke: 'white', 
                    strokeWidth: 2 
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
        
        
      case 'multiLine':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={categoryKey} />
            {valueKeys.map((key, index) => (
              <Line key={key} dataKey={key} 
     
           
           stroke={COLORS[index % COLORS.length]}
              strokeWidth={3}
              dot={{ stroke: '#36A2EB', strokeWidth: 2, r: 4, fill: 'white' }}
              activeDot={{ r: 6, fill: '#36A2EB', stroke: 'white', strokeWidth: 2 }}
              />
            ))}
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: 'none'
                }}
              />

            </LineChart>
          </ResponsiveContainer>
        );
        
        case 'area':
          return (
            <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={categoryKey} tickLine={true} axisLine={true} />
              <YAxis tickLine={true} axisLine={true} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  border: "none",
                  padding: "8px",
                }}
              />
              <Legend />

    
              {/* Dynamic Areas with Corrected Gradient References */}
              {valueKeys.map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={3}
                  fill={COLORS[index % COLORS.length]} // Apply gradient instead of solid color
                  fillOpacity={0.3}

                />
                
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
        
        
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: 'none'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
        
      case 'donut':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                innerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: 'none'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
        
      case 'pieExploded':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                paddingAngle={5}
                // Adding a custom activeIndex to show the exploded effect
                activeIndex={[0]}
                activeShape={(props) => {
                  const RADIAN = Math.PI / 180;
                  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
                  const sin = Math.sin(-RADIAN * midAngle);
                  const cos = Math.cos(-RADIAN * midAngle);
                  const sx = cx + (outerRadius + 10) * cos;
                  const sy = cy + (outerRadius + 10) * sin;
                  return (
                    <g>
                      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
                        {payload.name}
                      </text>
                      <path d={`M${cx},${cy}L${sx},${sy}`} stroke={fill} fill="none" />
                    </g>
                  );
                }}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    // Moving the first slice outward
                    {...(index === 0 ? { cx: 212, cy: 200 } : {})}
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: 'none'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
        
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
          <RadarChart 
            cx="50%" 
            cy="50%" 
            outerRadius={150} 
            data={data}
            margin={{ top: 30, right: 30, left: 30, bottom: 30 }}
          >
            <PolarGrid gridType="polygon" />
            <PolarAngleAxis 
              dataKey="Month" 
              tick={{ fill: '#666', fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0,150]}
              tick={{ fill: '#666', fontSize: 12 }}
            />
            
            {valueKeys.map((key, index) => (
              <Radar
                key={key}
                name={key}
                dataKey={key}
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={1}
                strokeWidth={2}
              />
            ))}
            
            <Legend 
              wrapperStyle={{ paddingTop: 20 }}
              formatter={(value) => <span className="text-gray-700">{value}</span>}
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              itemStyle={{ color: '#1a202c' }}
            />
          </RadarChart>
        </ResponsiveContainer>
        );
        
      case 'radial':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="10%" 
              outerRadius="80%" 
              barSize={20} 
              data={pieData}
            >
              <RadialBar
                minAngle={15}
                label={{ position: 'insideStart', fill: '#fff' }}
                background
                clockWise
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    cornerRadius={8}
                  />
                ))}
              </RadialBar>
              <Legend 
                iconSize={10} 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                wrapperStyle={{ paddingLeft: 20 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: 'none'
                }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        );
        
      case 'radialGauge':
        return (
<ResponsiveContainer width="100%" height={400}>
  <RadialBarChart
    cx="50%"
    cy="70%"
    innerRadius="100%"
    outerRadius="100%"
    barSize={10}
    startAngle={180}
    endAngle={0}
    data={pieData} // Make sure pieData contains multiple data points
  >
    <defs>
      {pieData.map((entry, index) => (
        <linearGradient key={index} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8} />
          <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.2} />
        </linearGradient>
      ))}
    </defs>

    {pieData.map((entry, index) => (
      <RadialBar
        key={index}
        background
        dataKey="value"
        data={[entry]} // Pass a single data entry for each RadialBar
        stroke={`url(#color${index})`} // Apply unique gradient color
        fill={`url(#color${index})`}
        cornerRadius={10}
      />
    ))}

    <text
      x="50%"
      y="80%"
      textAnchor="middle"
      dominantBaseline="middle"
      className="text-2xl font-bold text-gray-800"
    >
      {pieData[0].value}%
    </text>

    <PolarAngleAxis
      type="number"
      domain={[0, 100]}
      angleAxisId={0}
      tick={{ fill: "#999" }}
    />
  </RadialBarChart>
</ResponsiveContainer>

        );
        

        
        case 'scatter':
          return (
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                
                {/* Dynamically determine X and Y keys from the first data element */}
                <XAxis 
                  type="number" 
                  dataKey={valueKeys[0]} 
                  name={valueKeys[0]} 
                  label={{ value: valueKeys[0], position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  type="number" 
                  dataKey={valueKeys[1]} 
                  name={valueKeys[1]} 
                  label={{ value: valueKeys[1], angle: -90, position: 'insideLeft' }}
                />
                
                {/* If there's a third value key, use it for the Z axis (bubble size) */}
                {valueKeys.length > 2 && (
                  <ZAxis 
                    dataKey={valueKeys[2]} 
                    range={[60, 400]} 
                    name={valueKeys[2]} 
                  />
                )}
                
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: 'none'
                  }}
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(label) => `${categoryKey}: ${label}`}
                />
                
                <Legend />
                
                <Scatter 
      
                name="" 
                data={data} 

                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          );
        

    
    // For the Composed Chart case


case 'treemap':
  return (
<ResponsiveContainer width="100%" height={400}>
  <Treemap
    data={data}
    dataKey={valueKeys[0]} // Set the value key for sizing
    aspectRatio={4 / 3}
    stroke="#fff"
    fill="#8884d8"
    content={({ root, depth, x, y, width, height, index, name }) => {
      return depth === 1 ? ( // Only render for main elements
        <g key={`treemap-${index}`}>
          <rect x={x} y={y} width={width} height={height} fill={COLORS[index % COLORS.length]} stroke="#fff" />
          {width > 40 && height > 20 && ( // Show text only if space allows
            <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="bold">
              {data[index][categoryKey]} {/* Display the category name */}
            </text>
          )}
        </g>
      ) : null;
    }}
  />
</ResponsiveContainer>

  );


case 'horizontalBar':
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart 
        data={data} 
        layout="vertical"
        margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey={categoryKey} type="category" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: 'none'
          }}
          cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
        />
        <Legend />
        {valueKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} />
              
            ))}
      </BarChart>
    </ResponsiveContainer>
  );

    }
}; // Close renderChart function

return (
  <div className="bg-gray-500 p-6 rounded-xl shadow-md">
    <h2 className="text-2xl font-bold text-gray-800 mb-6">Beautiful Chart Gallery</h2>
    
    <div className="mb-6 flex flex-wrap gap-2">
      {[
        'bar', 'line', 'area', 'pie', 'radar', 'radial', 'scatter',
        'steppedLine', 'multiLine', 'donut', 'pieExploded', 'radialGauge',
, 'treemap', 'horizontalBar'
      ].map(type => (
        <button
          key={type}
          onClick={() => setActiveChart(type)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeChart === type 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
          }`}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)} Chart
        </button>
      ))}
    </div>

    {/* Title & Export Button */}
    <div className="flex justify-between items-center mb-1">
      <h3 className="text-lg font-semibold text-gray-700">
        {activeChart.charAt(0).toUpperCase() + activeChart.slice(1)} Chart
      </h3>
      <button
        onClick={exportToPNG}
        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export as PNG
      </button>
    </div>

    {/* Chart Container */}
    <div id="chart-container" className="bg-white p-1 rounded-xl shadow-sm">
      {renderChart()}
    </div>


  </div>
);

};

export default EnhancedCharts;

