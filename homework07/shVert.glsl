#version 300 es
layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform highp int u_shadingMode;
uniform highp int u_renderingMode;

// Light and material uniforms
uniform vec3 u_viewPos;
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

out vec3 fragPos;
out vec3 normal;
out vec3 lightingResult;

void main() {
    fragPos = vec3(u_model * vec4(a_position, 1.0));
    normal = mat3(transpose(inverse(u_model))) * a_normal;
    
    if (u_renderingMode == 0) { // GOURAUD
        vec3 viewDir = normalize(u_viewPos - fragPos);
        vec3 lightDir = normalize(light.position - fragPos);
        vec3 norm = normalize(normal);

        // Ambient
        vec3 ambient = light.ambient * material.diffuse;

        // Diffuse
        float diff = max(dot(norm, lightDir), 0.0);
        vec3 diffuse = light.diffuse * (diff * material.diffuse);

        // Specular
        vec3 reflectDir = reflect(-lightDir, norm);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
        vec3 specular = light.specular * (spec * material.specular);

        lightingResult = ambient + diffuse + specular;
    }
    
    gl_Position = u_projection * u_view * vec4(fragPos, 1.0);
}
