#version 300 es
precision highp float;

in vec3 fragPos;
in vec3 normal;
in vec3 lightingResult;

out vec4 FragColor;

uniform struct Material {
    vec3 diffuse;
    vec3 specular;
    float shininess;
} material;
uniform struct Light {
    vec3 position;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
} light;
uniform vec3 u_viewPos;
uniform highp int u_renderingMode;
uniform highp int u_shadingMode;

vec3 calculatePhongLighting(vec3 norm, vec3 viewDir) {
    // Ambient
    vec3 ambient = light.ambient * material.diffuse;

    // Diffuse
    vec3 lightDir = normalize(light.position - fragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = light.diffuse * (diff * material.diffuse);

    // Specular
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    vec3 specular = light.specular * (spec * material.specular);

    return ambient + diffuse + specular;
}

void main() {
    if (u_renderingMode == 0) { // GOURAUD
        FragColor = vec4(lightingResult, 1.0);
    } else { // PHONG
        vec3 viewDir = normalize(u_viewPos - fragPos);
        vec3 norm;
        
        if (u_shadingMode == 0) { // FLAT
            norm = normalize(cross(dFdx(fragPos), dFdy(fragPos)));
        } else { // SMOOTH
            norm = normalize(normal);
        }
        
        FragColor = vec4(calculatePhongLighting(norm, viewDir), 1.0);
    }
}
