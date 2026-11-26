<template>
  <div class="backend-codegen admin-page">
    <AdminPageHeader :title="t('backendCodegen.pageTitle')" :description="t('backendCodegen.pageDescription')" />

    <!-- 基础配置 -->
    <div class="config-section">
      <el-card>
        <template #header>
          <span>{{ t('backendCodegen.basicConfig') }}</span>
        </template>

        <el-form :model="config" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="t('backendCodegen.moduleName')">
                <el-input v-model="config.moduleName" :placeholder="t('backendCodegen.moduleNamePlaceholder')" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="t('backendCodegen.packageName')">
                <el-input v-model="config.packageName" placeholder="com.example.demo" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="t('backendCodegen.author')">
                <el-input v-model="config.author" :placeholder="t('backendCodegen.authorPlaceholder')" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="t('backendCodegen.tableName')">
                <el-input v-model="config.tableName" :placeholder="t('backendCodegen.tableNamePlaceholder')" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item :label="t('backendCodegen.frameworkSelect')">
            <el-radio-group v-model="config.framework">
              <el-radio label="spring-boot">Spring Boot</el-radio>
              <el-radio label="mybatis-plus">MyBatis Plus</el-radio>
              <el-radio label="jpa">Spring Data JPA</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 字段配置 -->
    <div class="field-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>{{ t('backendCodegen.fieldConfig') }}</span>
            <el-button type="primary" @click="handleAddField">
              <el-icon><Plus /></el-icon>
              {{ t('backendCodegen.addField') }}
            </el-button>
          </div>
        </template>

        <el-table :data="fieldList" border>
          <el-table-column prop="fieldName" :label="t('backendCodegen.fieldName')" width="150">
            <template #default="{ row }">
              <el-input v-model="row.fieldName" :placeholder="t('backendCodegen.fieldNamePlaceholder')" size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="fieldType" :label="t('backendCodegen.fieldType')" width="120">
            <template #default="{ row }">
              <el-select v-model="row.fieldType" :placeholder="t('backendCodegen.typePlaceholder')" size="small">
                <el-option label="String" value="String" />
                <el-option label="Integer" value="Integer" />
                <el-option label="Long" value="Long" />
                <el-option label="Double" value="Double" />
                <el-option label="Boolean" value="Boolean" />
                <el-option label="Date" value="Date" />
                <el-option label="BigDecimal" value="BigDecimal" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="comment" :label="t('backendCodegen.comment')" width="150">
            <template #default="{ row }">
              <el-input v-model="row.comment" :placeholder="t('backendCodegen.commentPlaceholder')" size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="nullable" :label="t('backendCodegen.nullable')" width="80">
            <template #default="{ row }">
              <el-checkbox v-model="row.nullable" />
            </template>
          </el-table-column>
          <el-table-column prop="primaryKey" :label="t('backendCodegen.primaryKey')" width="80">
            <template #default="{ row }">
              <el-checkbox v-model="row.primaryKey" />
            </template>
          </el-table-column>
          <el-table-column :label="t('backendCodegen.operation')" width="100">
            <template #default="{ $index }">
              <el-button type="danger" size="small" @click="handleDeleteField($index)">
                {{ t('backendCodegen.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 生成选项 -->
    <div class="generate-options">
      <el-card>
        <template #header>
          <span>{{ t('backendCodegen.generateOptions') }}</span>
        </template>

        <el-checkbox-group v-model="generateOptions">
          <el-checkbox label="entity">{{ t('backendCodegen.entity') }}</el-checkbox>
          <el-checkbox label="mapper">{{ t('backendCodegen.mapper') }}</el-checkbox>
          <el-checkbox label="service">{{ t('backendCodegen.service') }}</el-checkbox>
          <el-checkbox label="controller">{{ t('backendCodegen.controller') }}</el-checkbox>
          <el-checkbox label="dto">{{ t('backendCodegen.dto') }}</el-checkbox>
          <el-checkbox label="vo">{{ t('backendCodegen.vo') }}</el-checkbox>
        </el-checkbox-group>
      </el-card>
    </div>

    <!-- 操作按钮 -->
    <div class="action-section">
      <el-button type="primary" size="large" @click="handleGenerate" :loading="generating">
        <el-icon><Setting /></el-icon>
        {{ t('backendCodegen.generateCode') }}
      </el-button>
      <el-button size="large" @click="handlePreview">
        <el-icon><View /></el-icon>
        {{ t('backendCodegen.previewCode') }}
      </el-button>
    </div>

    <!-- 代码预览对话框 -->
    <el-dialog v-model="previewVisible" :title="t('backendCodegen.codePreview')" width="80%" top="5vh">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="Entity" name="entity" v-if="generateOptions.includes('entity')">
          <pre><code>{{ previewCode.entity }}</code></pre>
        </el-tab-pane>
        <el-tab-pane label="Mapper" name="mapper" v-if="generateOptions.includes('mapper')">
          <pre><code>{{ previewCode.mapper }}</code></pre>
        </el-tab-pane>
        <el-tab-pane label="Service" name="service" v-if="generateOptions.includes('service')">
          <pre><code>{{ previewCode.service }}</code></pre>
        </el-tab-pane>
        <el-tab-pane label="Controller" name="controller" v-if="generateOptions.includes('controller')">
          <pre><code>{{ previewCode.controller }}</code></pre>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Setting, View } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 字段接口
interface Field {
  fieldName: string
  fieldType: string
  comment: string
  nullable: boolean
  primaryKey: boolean
}

// 配置接口
interface Config {
  moduleName: string
  packageName: string
  author: string
  tableName: string
  framework: string
}

// 响应式数据
const config = reactive<Config>({
  moduleName: '',
  packageName: 'com.example.demo',
  author: '',
  tableName: '',
  framework: 'spring-boot'
})

const fieldList = ref<Field[]>([])
const generateOptions = ref(['entity', 'mapper', 'service', 'controller'])
const generating = ref(false)
const previewVisible = ref(false)
const activeTab = ref('entity')

const previewCode = reactive({
  entity: '',
  mapper: '',
  service: '',
  controller: ''
})

// 添加字段
const handleAddField = () => {
  fieldList.value.push({
    fieldName: '',
    fieldType: 'String',
    comment: '',
    nullable: true,
    primaryKey: false
  })
}

// 删除字段
const handleDeleteField = (index: number) => {
  fieldList.value.splice(index, 1)
}

// 生成Entity代码
const generateEntityCode = () => {
  const className = config.moduleName.charAt(0).toUpperCase() + config.moduleName.slice(1)
  const fields = fieldList.value.map(field => {
    const annotations = []
    if (field.primaryKey) {
      annotations.push('    @Id')
      annotations.push('    @GeneratedValue(strategy = GenerationType.IDENTITY)')
    }
    if (!field.nullable) {
      annotations.push('    @NotNull')
    }
    annotations.push(`    @Column(name = "${field.fieldName}")`)

    return `${annotations.join('\n')}
    private ${field.fieldType} ${field.fieldName}; // ${field.comment}`
  }).join('\n\n')

  return `package ${config.packageName}.entity;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.Date;

/**
 * ${config.moduleName} 实体类
 *
 * @author ${config.author}
 * @date ${new Date().toISOString().split('T')[0]}
 */
@Entity
@Table(name = "${config.tableName}")
public class ${className} {

${fields}

    // Getters and Setters
${fieldList.value.map(field => {
    const fieldName = field.fieldName
    const fieldType = field.fieldType
    const capitalizedName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
    return `    public ${fieldType} get${capitalizedName}() {
        return ${fieldName};
    }

    public void set${capitalizedName}(${fieldType} ${fieldName}) {
        this.${fieldName} = ${fieldName};
    }`
  }).join('\n\n')}
}`
}

// 生成Mapper代码
const generateMapperCode = () => {
  const className = config.moduleName.charAt(0).toUpperCase() + config.moduleName.slice(1)
  const primaryKeyField = fieldList.value.find(field => field.primaryKey)
  const primaryKeyType = primaryKeyField ? primaryKeyField.fieldType : 'Long'

  return `package ${config.packageName}.mapper;

import ${config.packageName}.entity.${className};
import org.apache.ibatis.annotations.*;
import java.util.List;

/**
 * ${config.moduleName} Mapper接口
 *
 * @author ${config.author}
 * @date ${new Date().toISOString().split('T')[0]}
 */
@Mapper
public interface ${className}Mapper {

    @Select("SELECT * FROM ${config.tableName}")
    List<${className}> selectAll();

    @Select("SELECT * FROM ${config.tableName} WHERE id = #{id}")
    ${className} selectById(${primaryKeyType} id);

    @Insert("INSERT INTO ${config.tableName} (${fieldList.value.filter(f => !f.primaryKey).map(f => f.fieldName).join(', ')}) VALUES (${fieldList.value.filter(f => !f.primaryKey).map(f => '#{' + f.fieldName + '}').join(', ')})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(${className} ${config.moduleName});

    @Update("UPDATE ${config.tableName} SET ${fieldList.value.filter(f => !f.primaryKey).map(f => f.fieldName + ' = #{' + f.fieldName + '}').join(', ')} WHERE id = #{id}")
    int update(${className} ${config.moduleName});

    @Delete("DELETE FROM ${config.tableName} WHERE id = #{id}")
    int deleteById(${primaryKeyType} id);
}`
}

// 生成Service代码
const generateServiceCode = () => {
  const className = config.moduleName.charAt(0).toUpperCase() + config.moduleName.slice(1)
  const primaryKeyField = fieldList.value.find(field => field.primaryKey)
  const primaryKeyType = primaryKeyField ? primaryKeyField.fieldType : 'Long'

  return `package ${config.packageName}.service;

import ${config.packageName}.entity.${className};
import ${config.packageName}.mapper.${className}Mapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

/**
 * ${config.moduleName} 服务类
 *
 * @author ${config.author}
 * @date ${new Date().toISOString().split('T')[0]}
 */
@Service
public class ${className}Service {

    @Autowired
    private ${className}Mapper ${config.moduleName}Mapper;

    public List<${className}> findAll() {
        return ${config.moduleName}Mapper.selectAll();
    }

    public ${className} findById(${primaryKeyType} id) {
        return ${config.moduleName}Mapper.selectById(id);
    }

    public ${className} save(${className} ${config.moduleName}) {
        if (${config.moduleName}.getId() == null) {
            ${config.moduleName}Mapper.insert(${config.moduleName});
        } else {
            ${config.moduleName}Mapper.update(${config.moduleName});
        }
        return ${config.moduleName};
    }

    public void deleteById(${primaryKeyType} id) {
        ${config.moduleName}Mapper.deleteById(id);
    }
}`
}

// 生成Controller代码
const generateControllerCode = () => {
  const className = config.moduleName.charAt(0).toUpperCase() + config.moduleName.slice(1)
  const primaryKeyField = fieldList.value.find(field => field.primaryKey)
  const primaryKeyType = primaryKeyField ? primaryKeyField.fieldType : 'Long'

  return `package ${config.packageName}.controller;

import ${config.packageName}.entity.${className};
import ${config.packageName}.service.${className}Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * ${config.moduleName} 控制器
 *
 * @author ${config.author}
 * @date ${new Date().toISOString().split('T')[0]}
 */
@RestController
@RequestMapping("/api/${config.moduleName}")
public class ${className}Controller {

    @Autowired
    private ${className}Service ${config.moduleName}Service;

    @GetMapping
    public List<${className}> findAll() {
        return ${config.moduleName}Service.findAll();
    }

    @GetMapping("/{id}")
    public ${className} findById(@PathVariable ${primaryKeyType} id) {
        return ${config.moduleName}Service.findById(id);
    }

    @PostMapping
    public ${className} create(@RequestBody ${className} ${config.moduleName}) {
        return ${config.moduleName}Service.save(${config.moduleName});
    }

    @PutMapping("/{id}")
    public ${className} update(@PathVariable ${primaryKeyType} id, @RequestBody ${className} ${config.moduleName}) {
        ${config.moduleName}.setId(id);
        return ${config.moduleName}Service.save(${config.moduleName});
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable ${primaryKeyType} id) {
        ${config.moduleName}Service.deleteById(id);
    }
}`
}

// 预览代码
const handlePreview = () => {
  if (!config.moduleName || fieldList.value.length === 0) {
    ElMessage.warning(t('backendCodegen.completeConfigWarning'))
    return
  }

  if (generateOptions.value.includes('entity')) {
    previewCode.entity = generateEntityCode()
  }
  if (generateOptions.value.includes('mapper')) {
    previewCode.mapper = generateMapperCode()
  }
  if (generateOptions.value.includes('service')) {
    previewCode.service = generateServiceCode()
  }
  if (generateOptions.value.includes('controller')) {
    previewCode.controller = generateControllerCode()
  }

  previewVisible.value = true
}

// 生成代码
const handleGenerate = async () => {
  if (!config.moduleName || fieldList.value.length === 0) {
    ElMessage.warning(t('backendCodegen.completeConfigWarning'))
    return
  }

  try {
    generating.value = true

    // 模拟生成过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    ElMessage.success(t('backendCodegen.generateSuccess'))
  } catch {
    ElMessage.error(t('backendCodegen.generateFailed'))
  } finally {
    generating.value = false
  }
}
</script>

<style scoped lang="scss">
.backend-codegen {
  padding: 20px;

  .page-header {
    margin-bottom: 20px;

    .page-title {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);
    }

    .page-description {
      margin: 0;
      color: var(--el-text-color-regular);
    }
  }

  .config-section,
  .field-section,
  .generate-options {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .action-section {
    text-align: center;
    margin-top: 30px;

    .el-button {
      margin: 0 10px;
    }
  }

  pre {
    background: var(--bg-color-overlay);
    padding: 15px;
    border-radius: 4px;
    overflow-x: auto;
    max-height: 500px;

    code {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      line-height: 1.5;
    }
  }
}

// 暗色模式样式
.dark {
  .backend-codegen {
    .el-card {
      background: var(--el-bg-color-page);
      border-color: var(--el-border-color);
    }

    .el-table {
      background: var(--el-bg-color-page);

      .el-table__header {
        background: var(--el-bg-color);
      }
    }

    pre {
      background: #2d2d2d;
      color: #f8f8f2;
    }
  }
}
</style>
