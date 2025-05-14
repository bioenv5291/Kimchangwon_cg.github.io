#version 300 es

precision highp float;

out vec4 FragColor;
in vec3 fragPos;  
in vec3 normal;  
in vec2 texCoord;

struct Material {
    sampler2D diffuse;
    vec3 specular;
    float shininess;
};

struct Light {
    vec3 direction;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

uniform Material material;
uniform Light light;
uniform vec3 u_viewPos;
uniform int u_toonLevels;

float toonQuantize(float value, int levels) {
    float step = 1.0 / float(levels);
    float quantized = floor(value / step) * step + step * 0.5;
    return min(quantized, 1.0);
}

void main() {
    // ambient
    vec3 rgb = texture(material.diffuse, texCoord).rgb;
    vec3 ambient = light.ambient * rgb;
    
    // diffuse 
    vec3 norm = normalize(normal);
    vec3 lightDir = normalize(-light.direction);
    float dotNormLight = dot(norm, lightDir);
    float diff = max(dotNormLight, 0.0);
    
    // Apply toon quantization to diffuse
    diff = toonQuantize(diff, u_toonLevels);
    vec3 diffuse = light.diffuse * diff * rgb;
    
    // specular
    vec3 viewDir = normalize(u_viewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec;
    
    if (dotNormLight > 0.0) {
        spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
        // Apply toon quantization to specular
        spec = toonQuantize(spec, u_toonLevels);
    } else {
        spec = 0.0;
    }
    
    vec3 specular = light.specular * spec * material.specular;
    
    vec3 result = ambient + diffuse + specular;
    FragColor = vec4(result, 1.0);
}